import { auth } from "@/lib/auth/auth";

export default async function SuspendedPage() {
  const session = await auth();

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-bold text-amber-600">Account Suspended</h1>
        <p className="mt-4 text-gray-600">
          Your account has been temporarily suspended. You cannot access
          platform features until the suspension is lifted.
        </p>
        {session?.user && (
          <p className="mt-4 text-sm text-gray-500">
            If you believe this is a mistake, please contact support.
          </p>
        )}
        <a
          href="/api/auth/signout"
          className="mt-6 inline-block rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
        >
          Sign Out
        </a>
      </div>
    </div>
  );
}
