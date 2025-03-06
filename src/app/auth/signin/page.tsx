import SignInForm from '@/components/auth/SignInForm';

export const metadata = {
  title: 'Sign In',
  description: 'Sign in to your account',
};

export default function SignInPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <SignInForm />
    </div>
  );
} 