import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff, Lock, Mail, Sparkles } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Input, Checkbox } from '@/components/common/Field';
import { Logo } from '@/components/layout/Logo';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useAsyncAction } from '@/hooks/useAsyncData';
import { APP_TAGLINE, DEMO_CREDENTIALS } from '@/constants/config';
import type { ApiError } from '@/types';

const loginSchema = z.object({
  email: z.string().min(1, 'Enter your email address.').email('Enter a valid email address.'),
  password: z.string().min(1, 'Enter your password.'),
  rememberMe: z.boolean().optional(),
});

type LoginValues = z.infer<typeof loginSchema>;

const HIGHLIGHTS = [
  'Book a client in under 30 seconds',
  'Live chair availability across every branch',
  'Revenue and retention reporting built in',
];

export default function LoginPage() {
  const { login, loginAsDemo } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);

  const redirectTo = (location.state as { from?: { pathname: string } } | null)?.from?.pathname ?? '/dashboard';

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: DEMO_CREDENTIALS.email, password: '', rememberMe: true },
  });

  const signIn = useAsyncAction(login);
  const demoSignIn = useAsyncAction(loginAsDemo);

  const handleFailure = (error: unknown) => {
    const apiError = error as ApiError;
    if (apiError.fieldErrors) {
      Object.entries(apiError.fieldErrors).forEach(([field, message]) => {
        if (field === 'email' || field === 'password') {
          setError(field, { message });
        }
      });
    }
    toast.error('Sign in failed', { description: apiError.message });
  };

  const onSubmit = handleSubmit(async (values) => {
    try {
      const user = await signIn.run(values);
      toast.success(`Welcome back, ${user?.name ?? 'there'}`, {
        description: 'You are signed in to BarberFlow.',
      });
      navigate(redirectTo, { replace: true });
    } catch (error) {
      handleFailure(error);
    }
  });

  const onDemoLogin = async () => {
    try {
      await demoSignIn.run();
      toast.success('Signed in with the demo account', {
        description: 'Explore BarberFlow with a full set of sample data.',
      });
      navigate('/dashboard', { replace: true });
    } catch (error) {
      handleFailure(error);
    }
  };

  return (
    <div className="flex min-h-screen bg-[rgb(var(--surface-page))]">
      {/* Brand panel — desktop only */}
      <aside className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-ink-950 p-12 lg:flex xl:w-[55%]">
        <div
          className="absolute inset-0 opacity-[0.18]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 20%, rgba(227,165,52,0.55), transparent 45%), radial-gradient(circle at 80% 70%, rgba(227,165,52,0.28), transparent 50%)',
          }}
          aria-hidden
        />
        <div className="relative">
          <Logo size="lg" inverted />
        </div>

        <div className="relative max-w-lg">
          <h1 className="font-display text-[40px] font-extrabold leading-[1.1] tracking-tight text-white xl:text-5xl">
            Simple bookings.
            <br />
            Happier clients.
            <br />
            <span className="text-gold-400">A better barber business.</span>
          </h1>
          <p className="mt-5 text-[15px] leading-relaxed text-ink-300">
            BarberFlow keeps every chair, every barber and every branch in one calendar — so the front
            desk stops guessing and starts booking.
          </p>

          <ul className="mt-8 space-y-3">
            {HIGHLIGHTS.map((highlight) => (
              <li key={highlight} className="flex items-center gap-3 text-sm text-ink-200">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gold-400/15 text-gold-400">
                  <Sparkles className="h-3 w-3" aria-hidden />
                </span>
                {highlight}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative flex items-center gap-6 text-sm text-ink-400">
          <span>
            <span className="block font-display text-2xl font-bold text-white">3</span>
            branches
          </span>
          <span className="h-8 w-px bg-white/10" aria-hidden />
          <span>
            <span className="block font-display text-2xl font-bold text-white">6</span>
            barbers
          </span>
          <span className="h-8 w-px bg-white/10" aria-hidden />
          <span>
            <span className="block font-display text-2xl font-bold text-white">4.8★</span>
            avg. rating
          </span>
        </div>
      </aside>

      {/* Form panel */}
      <main className="flex w-full flex-col justify-center px-6 py-12 sm:px-12 lg:w-1/2 xl:w-[45%]">
        <div className="mx-auto w-full max-w-sm">
          <div className="lg:hidden">
            <Logo size="md" />
          </div>

          <div className="mt-8 lg:mt-0">
            <h2 className="font-display text-[26px] font-bold tracking-tight text-ink-900 dark:text-white">
              Sign in to your shop
            </h2>
            <p className="mt-1.5 text-sm text-ink-500 dark:text-ink-400">{APP_TAGLINE}</p>
          </div>

          <form onSubmit={onSubmit} className="mt-8 space-y-4" noValidate>
            <Input
              label="Email address"
              type="email"
              autoComplete="email"
              placeholder="you@yourshop.com"
              leftIcon={<Mail className="h-4 w-4" />}
              error={errors.email?.message}
              {...register('email')}
            />

            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="••••••••"
              leftIcon={<Lock className="h-4 w-4" />}
              error={errors.password?.message}
              rightSlot={
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="rounded-md p-1.5 text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-700 dark:hover:bg-white/10"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              }
              {...register('password')}
            />

            <div className="flex items-center justify-between">
              <Checkbox label="Keep me signed in" {...register('rememberMe')} />
              <button
                type="button"
                onClick={() =>
                  toast.info('Password reset', {
                    description: 'Password recovery is not part of this demo build.',
                  })
                }
                className="text-[13px] font-medium text-ink-500 transition-colors hover:text-ink-900 dark:text-ink-400 dark:hover:text-white"
              >
                Forgot password?
              </button>
            </div>

            <Button type="submit" fullWidth size="lg" loading={signIn.loading} rightIcon={<ArrowRight className="h-4 w-4" />}>
              Sign in
            </Button>
          </form>

          <div className="my-6 flex items-center gap-4">
            <span className="h-px flex-1 bg-ink-200 dark:bg-white/10" aria-hidden />
            <span className="text-[11px] font-medium uppercase tracking-wider text-ink-400">or</span>
            <span className="h-px flex-1 bg-ink-200 dark:bg-white/10" aria-hidden />
          </div>

          <Button
            variant="outline"
            fullWidth
            size="lg"
            loading={demoSignIn.loading}
            onClick={onDemoLogin}
            leftIcon={<Sparkles className="h-4 w-4 text-gold-500" />}
          >
            Demo Login
          </Button>

          <div className="mt-6 rounded-xl border border-dashed border-ink-200 p-3.5 text-[13px] dark:border-white/10">
            <p className="font-medium text-ink-700 dark:text-ink-200">Demo credentials</p>
            <p className="mt-1 text-ink-500 dark:text-ink-400">
              Email <span className="font-medium text-ink-700 dark:text-ink-200">{DEMO_CREDENTIALS.email}</span>
              <br />
              Password <span className="font-medium text-ink-700 dark:text-ink-200">{DEMO_CREDENTIALS.password}</span>
            </p>
          </div>

          <p className="mt-6 text-center text-[13px] text-ink-500 dark:text-ink-400">
            Looking to book an appointment?{' '}
            <Link to="/book" className="font-medium text-gold-600 hover:underline dark:text-gold-400">
              Visit the booking page
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
