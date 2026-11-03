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
  message: string;
  profile?: MoodleUserProfile;
}

export class MoodleAuthUseCase {
  private readonly baseUrl = 'https://ead2.iff.edu.br';
  private readonly loginUrl = 'https://ead2.iff.edu.br/login/index.php';
  private readonly profileUrl = 'https://ead2.iff.edu.br/user/profile.php';
  private readonly dashboardUrl = 'https://ead2.iff.edu.br/my/';
  private readonly userAgent =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36';

  constructor(private readonly logger: ILogger) {}

  private extractCookies(response: Response): string[] {
    const headersAny = response.headers as any;
    if (typeof headersAny.getSetCookie === 'function') {
      const list = headersAny.getSetCookie();
      if (Array.isArray(list) && list.length > 0) {
        return list;
      }
    }
    const raw = response.headers.get('set-cookie');
    return raw ? [raw] : [];
  }

  private mergeCookieHeader(existing: string, setCookieHeaders: string[]): string {
    const map = new Map<string, string>();
    const feed = (cookiePart: string) => {
      const clean = (cookiePart || '').split(';')[0].trim();
      const eqIdx = clean.indexOf('=');
      if (eqIdx > 0) {
        const key = clean.substring(0, eqIdx).trim();
        map.set(key.toLowerCase(), clean);
      }
    };

    if (existing) {
      existing.split(';').forEach(feed);
    }
    setCookieHeaders.forEach(header => {
      header.split(/,(?=\s*[A-Za-z0-9_\-]+=)/).forEach(feed);
    });

    return Array.from(map.values()).join('; ');
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

  public async authenticate(username: string, password: string): Promise<MoodleLoginResult> {
    const cleanUsername = (username || '').replace(/[.\-\s]/g, '').trim();
    if (!cleanUsername || !password) {
      return {
        success: false,
        message: 'Informe seu usuário/CPF e senha do Moodle IFF.'
      };
    }

    try {
      this.logger.info(`Autenticando usuario '${cleanUsername}' no Moodle IFF...`);

      const getRes = await fetch(this.loginUrl, {
        method: 'GET',
        headers: {
          'User-Agent': this.userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        }
      });

      if (!getRes.ok) {
        return { success: false, message: 'Não foi possível conectar ao portal Moodle IFF.' };
      }

      const loginHtml = await getRes.text();
      const tokenMatch =
        loginHtml.match(/name=["']logintoken["']\s+value=["']([^"']+)["']/i) ||
        loginHtml.match(/value=["']([^"']+)["']\s+name=["']logintoken["']/i);

      if (!tokenMatch || !tokenMatch[1]) {
        return { success: false, message: 'Não foi possível obter o token de sessão do Moodle IFF.' };
      }

      const loginToken = tokenMatch[1];
      let cookieHeader = this.mergeCookieHeader('', this.extractCookies(getRes));

      const formParams = new URLSearchParams();
      formParams.append('anchor', '');
      formParams.append('logintoken', loginToken);
      formParams.append('username', cleanUsername);
      formParams.append('password', password);

      const postRes = await fetch(this.loginUrl, {
        method: 'POST',
        headers: {
          'Origin': this.baseUrl,
          'Referer': this.loginUrl,
          'User-Agent': this.userAgent,
          'Content-Type': 'application/x-www-form-urlencoded',
          'Cookie': cookieHeader
        },
        body: formParams.toString(),
        redirect: 'manual'
      });

      const postCookies = this.extractCookies(postRes);
      cookieHeader = this.mergeCookieHeader(cookieHeader, postCookies);

      let redirectLocation = postRes.headers.get('location') || '';
      if (redirectLocation.includes('loginredirect=1') || !cookieHeader.includes('MoodleSession=')) {
        return { success: false, message: 'Usuário ou senha inválidos no Moodle IFF.' };
      }

      if (redirectLocation.includes('testsession')) {
        const testUrl = redirectLocation.startsWith('http')
          ? redirectLocation
          : `${this.baseUrl}${redirectLocation.startsWith('/') ? '' : '/'}${redirectLocation}`;
        const testRes = await fetch(testUrl, {
          method: 'GET',
          headers: {
            'User-Agent': this.userAgent,
            'Cookie': cookieHeader
          },
          redirect: 'manual'
        });
        cookieHeader = this.mergeCookieHeader(cookieHeader, this.extractCookies(testRes));
      }

      const profileRes = await fetch(this.profileUrl, {
        method: 'GET',
        headers: {
          'User-Agent': this.userAgent,
          'Referer': this.loginUrl,
          'Cookie': cookieHeader
        },
        redirect: 'manual'
      });

      let profileHtml = '';
      if (profileRes.status === 200) {
        profileHtml = await profileRes.text();
      }

      if (!profileHtml.includes('card-profile')) {
        const dashRes = await fetch(this.dashboardUrl, {
          method: 'GET',
          headers: {
            'User-Agent': this.userAgent,
            'Cookie': cookieHeader
          },
          redirect: 'manual'
        });
        const dashHtml = dashRes.status === 200 ? await dashRes.text() : '';
        if (!dashHtml || dashHtml.includes('loginerrormessage') || dashHtml.includes('id="login"')) {
          return { success: false, message: 'Usuário ou senha inválidos no Moodle IFF.' };
        }
        const userIdMatch =
          dashHtml.match(/data-userid=["'](\d+)["']/i) ||
          dashHtml.match(/"userid"\s*:\s*(\d+)/i);
        if (userIdMatch && userIdMatch[1]) {
          const byIdRes = await fetch(`${this.profileUrl}?id=${userIdMatch[1]}`, {
            method: 'GET',
            headers: {
              'User-Agent': this.userAgent,
              'Cookie': cookieHeader
            }
          });
          if (byIdRes.ok) {
            profileHtml = await byIdRes.text();
          }
        }
        if (!profileHtml) {
          profileHtml = dashHtml;
        }
      }

      const parsed = this.parseMoodleProfile(profileHtml, cleanUsername);
      if (!parsed || !parsed.name) {
        return { success: false, message: 'Usuário ou senha inválidos no Moodle IFF.' };
      }

      this.logger.info(`Login Moodle IFF concluido para '${parsed.name}'.`);
      return {
        success: true,
        message: 'Autenticado com sucesso via Moodle IFF.',
        profile: parsed
      };
    } catch (err: any) {
      this.logger.error('Erro na autenticacao com o Moodle IFF', err);
      return {
        success: false,
        message: `Erro ao conectar ao Moodle IFF: ${err?.message || 'Falha de rede'}`
      };
    }
  }

  private parseMoodleProfile(html: string, fallbackUsername: string): MoodleUserProfile | null {
    if (!html) return null;

    let name = '';
    const cardProfileMatch = html.match(
      /<div[^>]*class=["'][^"']*card-profile[^"']*["'][^>]*>([\s\S]*?)<\/div>\s*<\/div>/i
    ) || html.match(/<div[^>]*class=["'][^"']*card-profile[^"']*["'][^>]*>([\s\S]*?)(?:<section|<\/div>)/i);

    if (cardProfileMatch && cardProfileMatch[1]) {
      const h3Match = cardProfileMatch[1].match(/<h3[^>]*>([\s\S]*?)<\/h3>/i);
      if (h3Match && h3Match[1]) {
        name = this.stripHtml(h3Match[1]).split(' [')[0].trim();
      }
    }

    if (!name) {
      const altMatch =
        html.match(/class=["']usertext[^"']*["'][^>]*>([^<]+)</i) ||
        html.match(/<h1[^>]*class=["'][^"']*h2[^"']*["'][^>]*>\s*Olá,\s*([^!<]+)/i) ||
        html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
      if (altMatch && altMatch[1]) {
        const candidate = this.stripHtml(altMatch[1]).split(' [')[0].trim();
        if (candidate && !candidate.toLowerCase().includes('moodle')) {
          name = candidate;
        }
      }
    }

    if (!name || name === fallbackUsername) {
      return null;
    }

    let email = `${fallbackUsername}@iff.edu.br`;
    const mailMatch = html.match(/href=["']mailto:([^"'>\s?]+)/i);
    if (mailMatch && mailMatch[1]) {
      try {
        email = decodeURIComponent(mailMatch[1].trim());
      } catch {
        email = mailMatch[1].trim();
      }
    }

    const details: Record<string, string> = {};
    const dlRegex = /<dl[^>]*>([\s\S]*?)<\/dl>/gi;
    let dlMatch: RegExpExecArray | null;
    while ((dlMatch = dlRegex.exec(html)) !== null) {
      const dlBody = dlMatch[1];
      const dtMatch = dlBody.match(/<dt[^>]*>([\s\S]*?)<\/dt>/i);
      const ddMatch = dlBody.match(/<dd[^>]*>([\s\S]*?)<\/dd>/i);
      if (dtMatch && ddMatch) {
        const key = this.stripHtml(dtMatch[1])
          .toLowerCase()
          .replace(/:/g, '')
          .replace(/\s+/g, '_')
          .trim();
        const val = this.stripHtml(ddMatch[1]);
        if (key && val) {
          details[key] = val;
        }
      }
    }

    const courses: string[] = [];
    const courseLinkRegex = /<a[^>]+href=["'][^"']*\/course\/view\.php\?[^"']*["'][^>]*>([\s\S]*?)<\/a>/gi;
    let cMatch: RegExpExecArray | null;
    while ((cMatch = courseLinkRegex.exec(html)) !== null) {
      const title = this.stripHtml(cMatch[1]);
      if (title && !courses.includes(title)) {
        courses.push(title);
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
      email,
      campus,
      city,
      course: primaryCourse,
      courses
    };
  }
}
