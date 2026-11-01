import * as cheerio from 'cheerio';
import { TokenManager } from './TokenManager.js';

export interface LoginResult {
  success: boolean;
  message: string;
  authToken?: string;
  token?: string;
  profile?: Record<string, any>;
}

export class MoodleAuthService {
  private readonly loginUrl = 'https://ead2.iff.edu.br/login/index.php';
  private readonly profileUrl = 'https://ead2.iff.edu.br/user/profile.php';

  private extractCookieString(setCookieHeaders: string[]): string {
    return setCookieHeaders
      .map(c => (c || '').split(';')[0].trim())
      .filter(Boolean)
      .join('; ');
  }

  public async authenticate(username: string, password: string): Promise<LoginResult> {
    try {
      const getResponse = await fetch(this.loginUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        }
      });

      if (!getResponse.ok) {
        return { success: false, message: 'Não foi possível conectar ao Moodle IFF.' };
      }

      const getHtml = await getResponse.text();
      const $get = cheerio.load(getHtml);
      const loginToken = $get('input[name="logintoken"]').val() as string;

      if (!loginToken) {
        return { success: false, message: 'Falha ao obter token de login do Moodle IFF.' };
      }

      const initialCookies = getResponse.headers.getSetCookie
        ? getResponse.headers.getSetCookie()
        : [getResponse.headers.get('set-cookie') || ''];
      
      let cookieHeader = this.extractCookieString(initialCookies);

      const params = new URLSearchParams();
      params.append('logintoken', loginToken);
      params.append('username', username);
      params.append('password', password);

      const postResponse = await fetch(this.loginUrl, {
        method: 'POST',
        headers: {
          'Origin': 'https://ead2.iff.edu.br',
          'Referer': this.loginUrl,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',
          'Content-Type': 'application/x-www-form-urlencoded',
          'Cookie': cookieHeader
        },
        body: params.toString(),
        redirect: 'manual'
      });

      const redirectLocation = postResponse.headers.get('location') || '';
      if (redirectLocation.includes('loginredirect=1')) {
        return { success: false, message: 'Usuário ou senha inválidos no Moodle IFF.' };
      }

      const postCookies = postResponse.headers.getSetCookie
        ? postResponse.headers.getSetCookie()
        : [postResponse.headers.get('set-cookie') || ''];
      
      const hasAuthCookie = postCookies.some(c => c && c.includes('MoodleSession='));
      if (!hasAuthCookie) {
        return { success: false, message: 'Usuário ou senha inválidos no Moodle IFF.' };
      }

      cookieHeader = this.extractCookieString(postCookies);

      const profileResponse = await fetch(this.profileUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',
          'Referer': this.loginUrl,
          'Cookie': cookieHeader
        },
        redirect: 'manual'
      });

      if (profileResponse.status !== 200) {
        return { success: false, message: 'Usuário ou senha inválidos no Moodle IFF.' };
      }

      const profileHtml = await profileResponse.text();
      if (!profileHtml.includes('card-profile')) {
        return { success: false, message: 'Usuário ou senha inválidos no Moodle IFF.' };
      }

      const profileData = this.parseProfile(profileHtml, username);
      if (!profileData || !profileData.name || profileData.name === username) {
        return { success: false, message: 'Usuário ou senha inválidos no Moodle IFF.' };
      }

      const authToken = TokenManager.createSession(username, profileData);

      return {
        success: true,
        message: 'Login realizado com sucesso via Moodle IFF.',
        authToken,
        token: authToken,
        profile: profileData
      };
    } catch (err: any) {
      return {
        success: false,
        message: `Erro na comunicação com o Moodle IFF: ${err?.message || err}`
      };
    }
  }

  public parseProfile(html: string, fallbackUsername: string): Record<string, any> | null {
    const $ = cheerio.load(html);
    const profileDiv = $('div.card.card-body.card-profile');
    if (profileDiv.length === 0) {
      return null;
    }

    const nameTag = profileDiv.find('h3');
    const name = nameTag.length > 0 ? nameTag.text().trim().split(' [')[0] : '';
    if (!name) {
      return null;
    }

    const emailTag = profileDiv.find('a[href^="mailto:"]');
    const email = emailTag.length > 0 ? emailTag.text().trim() : '';

    const details: Record<string, string> = {};

    profileDiv.find('dl').each((_, dl) => {
      const dt = $(dl).find('dt').text().trim().toLowerCase().replace(':', '').replace(/\s+/g, '_');
      const dd = $(dl).find('dd').text().trim();
      if (dt && dd) {
        details[dt] = dd;
      }
    });

    $('section.node_category').each((_, section) => {
      $(section).find('dl').each((_, dl) => {
        const dt = $(dl).find('dt').text().trim().toLowerCase().replace(':', '').replace(/\s+/g, '_');
        const dd = $(dl).find('dd').text().trim();
        if (dt && dd) {
          details[dt] = dd;
        }
      });
    });

    const courses: string[] = [];
    $('div.profile_tree section, section.node_category').each((_, sec) => {
      const headerText = $(sec).find('h3').text().toLowerCase();
      if (headerText.includes('curso') || headerText.includes('detalhes do curso')) {
        $(sec).find('li a, dd a').each((_, link) => {
          const courseTitle = $(link).text().trim();
          if (courseTitle && !courses.includes(courseTitle)) {
            courses.push(courseTitle);
          }
        });
      }
    });

    return {
      name,
      email,
      username: fallbackUsername,
      campus: details['campus'] || details['instituicao'] || 'Instituto Federal Fluminense (IFF)',
      city: details['cidade_municipio'] || details['cidade'] || '',
      country: details['pais'] || 'Brasil',
      firstAccess: details['primeiro_acesso_ao_site'] || '',
      lastAccess: details['ultimo_acesso_ao_site'] || '',
      profileUrl: this.profileUrl,
      courses
    };
  }
}
