import { ILogger } from '../../core/logger/ILogger';

export interface MoodleUserProfile {
  username: string;
  name: string;
  email: string;
  campus: string;
  city?: string;
  course?: string;
  courses: string[];
}

export interface MoodleLoginResult {
  success: boolean;
  authenticated: boolean;
  message: string;
  error?: string;
  profile?: MoodleUserProfile;
}

export class MoodleAuthUseCase {
  private readonly loginUrl = 'https://ead2.iff.edu.br/login/index.php';
  private readonly profileUrl = 'https://ead2.iff.edu.br/user/profile.php';
  private readonly userAgent =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36';

  constructor(private readonly logger: ILogger) {}

  private extractCookieString(response: Response): string {
    const headersAny = response.headers as any;
    let rawList: string[] = [];

    if (typeof headersAny.getSetCookie === 'function') {
      const setCookies = headersAny.getSetCookie();
      if (Array.isArray(setCookies) && setCookies.length > 0) {
        rawList = setCookies;
      }
    }

    if (rawList.length === 0) {
      const single = response.headers.get('set-cookie');
      if (single) {
        rawList = single.split(/,(?=\s*[A-Za-z0-9_\-]+=)/);
      }
    }

    return rawList
      .map(c => (c || '').split(';')[0].trim())
      .filter(Boolean)
      .join('; ');
  }

  private stripHtml(raw: string): string {
    if (!raw) return '';
    return raw
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/gi, ' ')
      .replace(/&amp;/gi, '&')
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>')
      .replace(/&quot;/gi, '"')
      .replace(/&#0?39;/gi, "'")
      .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
      .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
      .replace(/\s+/g, ' ')
      .trim();
  }

  private normalizeUsername(rawUsername: string): string {
    const trimmed = (rawUsername || '').trim();
    if (/^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/.test(trimmed)) {
      return trimmed.replace(/[.\-\s]/g, '');
    }
    return trimmed;
  }

  private fail(message: string): MoodleLoginResult {
    return {
      success: false,
      authenticated: false,
      message,
      error: message
    };
  }

  public async authenticate(username: string, password: string): Promise<MoodleLoginResult> {
    const normalizedUser = this.normalizeUsername(username);
    if (!normalizedUser || !password) {
      return this.fail('Informe seu usuário/CPF e senha do Moodle IFF.');
    }

    try {
      this.logger.info(`Autenticando usuario '${normalizedUser}' no Moodle IFF...`);

      const getResponse = await fetch(this.loginUrl, {
        method: 'GET',
        headers: {
          'User-Agent': this.userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        },
        signal: AbortSignal.timeout(15000)
      });

      if (!getResponse.ok) {
        return this.fail('Não foi possível conectar ao Moodle IFF.');
      }

      const getHtml = await getResponse.text();
      const tokenMatch =
        getHtml.match(/name=["']logintoken["']\s+value=["']([^"']+)["']/i) ||
        getHtml.match(/value=["']([^"']+)["']\s+name=["']logintoken["']/i);

      if (!tokenMatch || !tokenMatch[1]) {
        return this.fail('Falha ao obter token de login do Moodle IFF.');
      }

      const loginToken = tokenMatch[1];
      let cookieHeader = this.extractCookieString(getResponse);

      const params = new URLSearchParams();
      params.append('logintoken', loginToken);
      params.append('username', normalizedUser);
      params.append('password', password);

      const postResponse = await fetch(this.loginUrl, {
        method: 'POST',
        headers: {
          'Origin': 'https://ead2.iff.edu.br',
          'Referer': this.loginUrl,
          'User-Agent': this.userAgent,
          'Content-Type': 'application/x-www-form-urlencoded',
          'Cookie': cookieHeader
        },
        body: params.toString(),
        redirect: 'manual',
        signal: AbortSignal.timeout(15000)
      });

      const redirectLocation = postResponse.headers.get('location') || '';
      if (redirectLocation.includes('loginredirect=1')) {
        return this.fail('Usuário ou senha inválidos no Moodle IFF.');
      }

      const postCookieHeader = this.extractCookieString(postResponse);
      if (!postCookieHeader.includes('MoodleSession=')) {
        return this.fail('Usuário ou senha inválidos no Moodle IFF.');
      }

      cookieHeader = postCookieHeader;

      const profileResponse = await fetch(this.profileUrl, {
        method: 'GET',
        headers: {
          'User-Agent': this.userAgent,
          'Referer': this.loginUrl,
          'Cookie': cookieHeader
        },
        redirect: 'manual',
        signal: AbortSignal.timeout(15000)
      });

      if (profileResponse.status !== 200) {
        return this.fail('Usuário ou senha inválidos no Moodle IFF.');
      }

      const profileHtml = await profileResponse.text();
      if (!profileHtml.includes('card-profile')) {
        return this.fail('Usuário ou senha inválidos no Moodle IFF.');
      }

      const profileData = this.parseProfile(profileHtml, normalizedUser);
      if (!profileData || !profileData.name || profileData.name === normalizedUser) {
        return this.fail('Usuário ou senha inválidos no Moodle IFF.');
      }

      this.logger.info(`Login Moodle IFF realizado com sucesso para '${profileData.name}'.`);

      return {
        success: true,
        authenticated: true,
        message: 'Login realizado com sucesso via Moodle IFF.',
        profile: profileData
      };
    } catch (err: any) {
      this.logger.error('Erro na comunicacao com o Moodle IFF', err);
      return this.fail(`Erro na comunicação com o Moodle IFF: ${err?.message || 'Tempo limite excedido'}`);
    }
  }

  private parseProfile(html: string, fallbackUsername: string): MoodleUserProfile | null {
    if (!html || !html.includes('card-profile')) {
      return null;
    }

    let name = '';
    const cardIdx = html.indexOf('card-profile');
    if (cardIdx !== -1) {
      const cardSlice = html.substring(cardIdx, cardIdx + 4000);
      const h3Match = cardSlice.match(/<h3[^>]*>([\s\S]*?)<\/h3>/i);
      if (h3Match && h3Match[1]) {
        name = this.stripHtml(h3Match[1]).split(' [')[0].trim();
      }
    }

    if (!name) {
      return null;
    }

    let email = '';
    const mailMatch = html.match(/<a[^>]+href=["']mailto:([^"'>\s?]+)["'][^>]*>([\s\S]*?)<\/a>/i);
    if (mailMatch) {
      email = this.stripHtml(mailMatch[2]) || mailMatch[1].trim();
    }

    const details: Record<string, string> = {};
    const dlRegex = /<dl[^>]*>([\s\S]*?)<\/dl>/gi;
    let dlMatch: RegExpExecArray | null;
    while ((dlMatch = dlRegex.exec(html)) !== null) {
      const dlBody = dlMatch[1];
      const dtMatch = dlBody.match(/<dt[^>]*>([\s\S]*?)<\/dt>/i);
      const ddMatch = dlBody.match(/<dd[^>]*>([\s\S]*?)<\/dd>/i);
      if (dtMatch && ddMatch) {
        const dt = this.stripHtml(dtMatch[1])
          .toLowerCase()
          .replace(/:/g, '')
          .replace(/\s+/g, '_')
          .trim();
        const dd = this.stripHtml(ddMatch[1]);
        if (dt && dd) {
          details[dt] = dd;
        }
      }
    }

    const courses: string[] = [];
    const sectionRegex = /<section[^>]*class=["'][^"']*node_category[^"']*["'][^>]*>([\s\S]*?)<\/section>/gi;
    let secMatch: RegExpExecArray | null;
    while ((secMatch = sectionRegex.exec(html)) !== null) {
      const secHtml = secMatch[1];
      const h3Match = secHtml.match(/<h3[^>]*>([\s\S]*?)<\/h3>/i);
      const headerText = h3Match ? this.stripHtml(h3Match[1]).toLowerCase() : '';
      if (headerText.includes('curso') || headerText.includes('detalhes do curso')) {
        const linkRegex = /<a[^>]+href=["'][^"']+["'][^>]*>([\s\S]*?)<\/a>/gi;
        let lMatch: RegExpExecArray | null;
        while ((lMatch = linkRegex.exec(secHtml)) !== null) {
          const courseTitle = this.stripHtml(lMatch[1]);
          if (courseTitle && !courses.includes(courseTitle)) {
            courses.push(courseTitle);
          }
        }
      }
    }

    if (courses.length === 0) {
      const courseViewRegex = /<a[^>]+href=["'][^"']*\/course\/view\.php\?[^"']*["'][^>]*>([\s\S]*?)<\/a>/gi;
      let cMatch: RegExpExecArray | null;
      while ((cMatch = courseViewRegex.exec(html)) !== null) {
        const courseTitle = this.stripHtml(cMatch[1]);
        if (courseTitle && !courses.includes(courseTitle)) {
          courses.push(courseTitle);
        }
      }
    }

    const campus =
      details['campus'] ||
      details['instituicao'] ||
      details['instituição'] ||
      'Instituto Federal Fluminense (IFF)';

    const city =
      details['cidade_municipio'] ||
      details['cidade/município'] ||
      details['cidade'] ||
      '';

    const primaryCourse =
      details['curso'] ||
      (courses.length > 0 ? courses[0] : '');

    return {
      username: fallbackUsername,
      name,
      email: email || `${fallbackUsername}@iff.edu.br`,
      campus,
      city,
      course: primaryCourse,
      courses
    };
  }
}
