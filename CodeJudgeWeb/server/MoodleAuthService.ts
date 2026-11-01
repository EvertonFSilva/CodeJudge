import * as cheerio from 'cheerio';
import { TokenManager } from './TokenManager.js';

export interface LoginResult {
  success: boolean;
  message: string;
  authToken?: string;
  profile?: Record<string, any>;
}

export class MoodleAuthService {
  private readonly loginUrl = 'https://ead2.iff.edu.br/login/index.php';
  private readonly profileUrl = 'https://ead2.iff.edu.br/user/profile.php';

  private extractCookieString(setCookieHeaders: string[]): string {
    return setCookieHeaders
      .map(c => c.split(';')[0].trim())
      .join('; ');
  }

  public async authenticate(username: string, password: string): Promise<LoginResult> {
    const existing = TokenManager.findSessionByUsername(username);
    if (existing) {
      return {
        success: true,
        message: 'Sessão já ativa',
        authToken: existing.token,
        profile: existing.session.profile
      };
    }

    try {
      const getResponse = await fetch(this.loginUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        }
      });

      if (!getResponse.ok) {
        return { success: false, message: 'Não foi possível conectar ao Moodle' };
      }

      const getHtml = await getResponse.text();
      const $get = cheerio.load(getHtml);
      const loginToken = $get('input[name="logintoken"]').val() as string;

      if (!loginToken) {
        return { success: false, message: 'Falha ao obter token de login do Moodle' };
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

      const postCookies = postResponse.headers.getSetCookie 
        ? postResponse.headers.getSetCookie() 
        : [postResponse.headers.get('set-cookie') || ''];
      
      if (postCookies.length > 0 && postCookies[0]) {
        cookieHeader = this.extractCookieString(postCookies);
      }

      const postHtml = await postResponse.text();

      if (postHtml.includes('loginerrormessage')) {
        return { success: false, message: 'Usuário ou senha inválidos no Moodle' };
      }

      const profileResponse = await fetch(this.profileUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',
          'Referer': this.loginUrl,
          'Cookie': cookieHeader
        }
      });

      const profileHtml = await profileResponse.text();
      const profileData = this.parseProfile(profileHtml, username);

      const authToken = TokenManager.createSession(username, profileData);

      return {
        success: true,
        message: 'Login realizado com sucesso via Moodle',
        authToken,
        profile: profileData
      };
    } catch (err: any) {
      return {
        success: false,
        message: `Erro na comunicação com o Moodle: ${err?.message || err}`
      };
    }
  }

  public parseProfile(html: string, fallbackUsername: string): Record<string, any> {
    const $ = cheerio.load(html);
    const profileDiv = $('div.card.card-body.card-profile');

    const nameTag = profileDiv.find('h3');
    const name = nameTag.length > 0 ? nameTag.text().trim().split(' [')[0] : fallbackUsername;

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

    return {
      name,
      email,
      username: fallbackUsername,
      ...details
    };
  }
}
