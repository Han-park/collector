import SignUpForm from '@/components/auth/SignUpForm';

export const metadata = {
  title: 'Sign Up',
  description: 'Create a new account',
};

export default function SignUpPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <SignUpForm />
    </div>
  );
} 