import { Router, Request, Response } from 'express';
import { MoodleAuthService } from './MoodleAuthService.js';
import { TokenManager } from './TokenManager.js';

export const authRouter = Router();
const authService = new MoodleAuthService();

authRouter.post('/login', async (req: Request, res: Response) => {
  const { username, password } = req.body || {};

  if (!username || !password) {
    res.status(400).json({
      success: false,
      message: 'CPF/Usuário e senha são obrigatórios'
    });
    return;
  }

  const result = await authService.authenticate(username, password);
  if (!result.success) {
    res.status(401).json(result);
    return;
  }

  res.json(result);
});

authRouter.get('/profile', (req: Request, res: Response) => {
  const token = (req.headers['x-auth-token'] as string) || (req.headers['authorization']?.replace(/^Bearer\s+/i, '') as string);

  if (!token) {
    res.status(401).json({
      success: false,
      message: 'Token de autenticação não fornecido'
    });
    return;
  }

  const session = TokenManager.getSession(token);
  if (!session) {
    res.status(401).json({
      success: false,
      message: 'Sessão expirada ou inválida'
    });
    return;
  }

  res.json({
    success: true,
    message: 'Perfil recuperado com sucesso',
    profile: session.profile
  });
});

authRouter.post('/logout', (req: Request, res: Response) => {
  const token = (req.headers['x-auth-token'] as string) || (req.headers['authorization']?.replace(/^Bearer\s+/i, '') as string);

  if (token) {
    TokenManager.removeSession(token);
  }

  res.json({
    success: true,
    message: 'Sessão encerrada com sucesso'
  });
});
