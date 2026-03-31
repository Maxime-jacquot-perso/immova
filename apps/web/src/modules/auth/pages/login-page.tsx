import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { z } from 'zod';
import { useAuth } from '../auth-context';
import { getErrorMessage } from '../../../shared/ui/error-utils';
import { FeedbackMessage } from '../../../shared/ui/feedback-message';

const schema = z.object({
  email: z.string().email('Saisissez un email valide.'),
  password: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caracteres.'),
});

type FormValues = z.infer<typeof schema>;

export function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const invitationAccepted = searchParams.get('invitation') === 'accepted';
  const emailPrefill = searchParams.get('email') ?? '';
  const organizationSlug = searchParams.get('organizationSlug') || undefined;
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: emailPrefill,
      password: '',
    },
  });

  return (
    <div className="auth-screen">
      <img src="/logo-text-bleu.svg" alt="Immova" className="auth-screen__logo" />
      <div className="panel auth-card stack">
        {invitationAccepted ? (
          <FeedbackMessage
            title="Acces active"
            message="Votre invitation est validee. Connectez-vous pour ouvrir l'application."
            type="success"
          />
        ) : null}

        <div>
          <h1 style={{ margin: 0 }}>Pilotage Immo</h1>
          <p className="page-subtitle">
            Connectez-vous pour acceder a l'application et au back-office admin.
          </p>
        </div>

        <form
          className="stack"
          onSubmit={handleSubmit(async (values) => {
            try {
              await login({
                ...values,
                organizationSlug,
              });
              navigate('/');
            } catch (error) {
              setError('root', {
                message: getErrorMessage(error, 'Connexion impossible'),
              });
            }
          })}
        >
          <div className="field">
            <label htmlFor="email">Email</label>
            <input id="email" type="email" {...register('email')} />
            {errors.email ? (
              <div className="field__error">{errors.email.message}</div>
            ) : null}
          </div>

          <div className="field">
            <label htmlFor="password">Mot de passe</label>
            <input id="password" type="password" {...register('password')} />
            {errors.password ? (
              <div className="field__error">{errors.password.message}</div>
            ) : null}
          </div>

          {errors.root ? (
            <div className="field__error">{errors.root.message}</div>
          ) : null}

          <button className="button" disabled={isSubmitting} type="submit">
            {isSubmitting ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>
      </div>
    </div>
  );
}
