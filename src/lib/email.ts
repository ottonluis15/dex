import nodemailer from 'nodemailer';
import { prisma } from './prisma';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  type: 'PASSWORD_RESET' | 'WELCOME' | 'CASE_UPDATE' | 'DEADLINE' | 'NEWSLETTER' | 'INVITE';
  officeId?: string;
}

export async function sendEmail({ to, subject, html, type, officeId }: SendEmailOptions) {
  const log = await prisma.emailLog.create({
    data: {
      to,
      subject,
      type,
      officeId,
      status: 'PENDING',
    },
  });

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || 'Dex Advocacia <noreply@dex.com>',
      to,
      subject,
      html: wrapInTemplate(subject, html),
    });

    await prisma.emailLog.update({
      where: { id: log.id },
      data: { status: 'SENT', sentAt: new Date() },
    });

    return { success: true };
  } catch (error: any) {
    await prisma.emailLog.update({
      where: { id: log.id },
      data: { status: 'FAILED', error: error.message },
    });

    console.error('Erro ao enviar email:', error);
    return { success: false, error: error.message };
  }
}

function wrapInTemplate(title: string, content: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
    </head>
    <body style="margin:0;padding:0;background-color:#0a0e1a;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#0a0e1a;">
        <tr>
          <td align="center" style="padding:40px 20px;">
            <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color:#111827;border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,0.08);">
              <!-- Header -->
              <tr>
                <td style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px 40px;text-align:center;">
                  <h1 style="margin:0;color:#fff;font-size:28px;font-weight:700;letter-spacing:-0.5px;">⚖️ Dex</h1>
                  <p style="margin:4px 0 0;color:rgba(255,255,255,0.8);font-size:14px;">Sistema de Advocacia</p>
                </td>
              </tr>
              <!-- Content -->
              <tr>
                <td style="padding:40px;">
                  ${content}
                </td>
              </tr>
              <!-- Footer -->
              <tr>
                <td style="padding:24px 40px;border-top:1px solid rgba(255,255,255,0.08);text-align:center;">
                  <p style="margin:0;color:#6b7280;font-size:12px;">
                    © ${new Date().getFullYear()} Dex Advocacia. Todos os direitos reservados.
                  </p>
                  <p style="margin:8px 0 0;color:#6b7280;font-size:11px;">
                    Este é um e-mail automático. Por favor, não responda.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

export function getPasswordResetEmail(name: string, resetUrl: string): string {
  return `
    <h2 style="margin:0 0 16px;color:#f9fafb;font-size:22px;font-weight:600;">Recuperação de Senha</h2>
    <p style="margin:0 0 24px;color:#9ca3af;font-size:15px;line-height:1.6;">
      Olá <strong style="color:#f9fafb;">${name}</strong>,<br><br>
      Recebemos uma solicitação para redefinir sua senha. Clique no botão abaixo para criar uma nova senha:
    </p>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
      <tr>
        <td align="center" style="padding:8px 0 32px;">
          <a href="${resetUrl}" style="display:inline-block;padding:14px 40px;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;text-decoration:none;border-radius:10px;font-size:15px;font-weight:600;">
            Redefinir Senha
          </a>
        </td>
      </tr>
    </table>
    <p style="margin:0;color:#6b7280;font-size:13px;line-height:1.5;">
      Se você não solicitou a alteração de senha, ignore este e-mail. O link expira em <strong>1 hora</strong>.
    </p>
    <p style="margin:16px 0 0;color:#6b7280;font-size:12px;word-break:break-all;">
      Link direto: ${resetUrl}
    </p>
  `;
}

export function getWelcomeEmail(name: string, officeName: string, loginUrl: string): string {
  return `
    <h2 style="margin:0 0 16px;color:#f9fafb;font-size:22px;font-weight:600;">Bem-vindo ao Dex! 🎉</h2>
    <p style="margin:0 0 24px;color:#9ca3af;font-size:15px;line-height:1.6;">
      Olá <strong style="color:#f9fafb;">${name}</strong>,<br><br>
      Sua conta no escritório <strong style="color:#8b5cf6;">${officeName}</strong> foi criada com sucesso!
      Agora você pode acessar o sistema para gerenciar seus processos, clientes e muito mais.
    </p>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
      <tr>
        <td align="center" style="padding:8px 0 32px;">
          <a href="${loginUrl}" style="display:inline-block;padding:14px 40px;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;text-decoration:none;border-radius:10px;font-size:15px;font-weight:600;">
            Acessar Dex
          </a>
        </td>
      </tr>
    </table>
    <div style="background:rgba(99,102,241,0.1);border:1px solid rgba(99,102,241,0.2);border-radius:10px;padding:20px;margin:0 0 16px;">
      <p style="margin:0 0 8px;color:#f9fafb;font-size:14px;font-weight:600;">✨ Primeiros passos:</p>
      <ul style="margin:0;padding:0 0 0 20px;color:#9ca3af;font-size:13px;line-height:1.8;">
        <li>Cadastre seus clientes</li>
        <li>Crie seus processos</li>
        <li>Convide membros da equipe</li>
        <li>Acompanhe prazos e audiências</li>
      </ul>
    </div>
  `;
}

export function getInviteEmail(name: string, officeName: string, inviterName: string, loginUrl: string, tempPassword: string): string {
  return `
    <h2 style="margin:0 0 16px;color:#f9fafb;font-size:22px;font-weight:600;">Você foi convidado! 📩</h2>
    <p style="margin:0 0 24px;color:#9ca3af;font-size:15px;line-height:1.6;">
      Olá <strong style="color:#f9fafb;">${name}</strong>,<br><br>
      <strong style="color:#f9fafb;">${inviterName}</strong> te convidou para participar do escritório 
      <strong style="color:#8b5cf6;">${officeName}</strong> no Dex.
    </p>
    <div style="background:rgba(99,102,241,0.1);border:1px solid rgba(99,102,241,0.2);border-radius:10px;padding:20px;margin:0 0 24px;">
      <p style="margin:0 0 8px;color:#f9fafb;font-size:14px;font-weight:600;">Seus dados de acesso:</p>
      <p style="margin:0;color:#9ca3af;font-size:14px;line-height:1.8;">
        Senha temporária: <strong style="color:#f59e0b;font-family:monospace;font-size:16px;">${tempPassword}</strong>
      </p>
    </div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
      <tr>
        <td align="center" style="padding:8px 0 24px;">
          <a href="${loginUrl}" style="display:inline-block;padding:14px 40px;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;text-decoration:none;border-radius:10px;font-size:15px;font-weight:600;">
            Acessar Minha Conta
          </a>
        </td>
      </tr>
    </table>
    <p style="margin:0;color:#f59e0b;font-size:13px;">⚠️ Recomendamos que altere sua senha no primeiro acesso.</p>
  `;
}

export function getCaseUpdateEmail(name: string, caseTitle: string, caseNumber: string, updateText: string, caseUrl: string): string {
  return `
    <h2 style="margin:0 0 16px;color:#f9fafb;font-size:22px;font-weight:600;">Atualização de Processo 📋</h2>
    <p style="margin:0 0 24px;color:#9ca3af;font-size:15px;line-height:1.6;">
      Olá <strong style="color:#f9fafb;">${name}</strong>,<br><br>
      Houve uma atualização no processo:
    </p>
    <div style="background:rgba(99,102,241,0.1);border:1px solid rgba(99,102,241,0.2);border-radius:10px;padding:20px;margin:0 0 24px;">
      <p style="margin:0 0 4px;color:#8b5cf6;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Processo</p>
      <p style="margin:0 0 12px;color:#f9fafb;font-size:16px;font-weight:600;">${caseTitle}</p>
      <p style="margin:0 0 4px;color:#6b7280;font-size:12px;">Nº ${caseNumber}</p>
      <hr style="border:none;border-top:1px solid rgba(255,255,255,0.08);margin:12px 0;">
      <p style="margin:0;color:#9ca3af;font-size:14px;">${updateText}</p>
    </div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
      <tr>
        <td align="center" style="padding:8px 0;">
          <a href="${caseUrl}" style="display:inline-block;padding:14px 40px;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;text-decoration:none;border-radius:10px;font-size:15px;font-weight:600;">
            Ver Processo
          </a>
        </td>
      </tr>
    </table>
  `;
}

export function getDeadlineEmail(name: string, deadlines: { title: string; date: string; caseTitle: string }[]): string {
  const deadlineItems = deadlines.map(d => `
    <tr>
      <td style="padding:12px 16px;border-bottom:1px solid rgba(255,255,255,0.05);">
        <p style="margin:0 0 4px;color:#f9fafb;font-size:14px;font-weight:500;">${d.title}</p>
        <p style="margin:0;color:#6b7280;font-size:12px;">${d.caseTitle}</p>
      </td>
      <td style="padding:12px 16px;border-bottom:1px solid rgba(255,255,255,0.05);text-align:right;">
        <span style="color:#f59e0b;font-size:13px;font-weight:600;">${d.date}</span>
      </td>
    </tr>
  `).join('');

  return `
    <h2 style="margin:0 0 16px;color:#f9fafb;font-size:22px;font-weight:600;">⏰ Prazos Próximos</h2>
    <p style="margin:0 0 24px;color:#9ca3af;font-size:15px;line-height:1.6;">
      Olá <strong style="color:#f9fafb;">${name}</strong>,<br><br>
      Você tem prazos importantes se aproximando:
    </p>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:rgba(99,102,241,0.05);border:1px solid rgba(99,102,241,0.15);border-radius:10px;overflow:hidden;">
      ${deadlineItems}
    </table>
  `;
}
