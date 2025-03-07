import Link from 'next/link';

export default function UserNotFound() {
  return (
    <div className="max-w-4xl mx-auto text-center py-12">
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-8">
        <h2 className="text-2xl font-bold text-white mb-4">User Not Found</h2>
        <p className="text-gray-400 mb-6">
          The user profile you&apos;re looking for doesn&apos;t exist or may have been removed.
        </p>
        <Link 
          href="/" 
          className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Return Home
        </Link>
      </div>
    </div>
  );
} 