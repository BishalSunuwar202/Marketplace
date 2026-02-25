export default function BannedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-bold text-red-600">Account Banned</h1>
        <p className="mt-4 text-gray-600">
          Your account has been permanently banned from LaptopMarket due to a
          violation of our terms of service.
        </p>
        <p className="mt-4 text-sm text-gray-500">
          If you believe this is an error, please contact{" "}
          <span className="font-medium">support@laptopmarket.com</span> to
          submit an appeal.
        </p>
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
