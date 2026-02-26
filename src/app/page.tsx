import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <span className="text-xl font-bold text-gray-900">LaptopMarket</span>
          <div className="flex items-center gap-3">
            <Link
              href="/auth/login"
              className="rounded-md px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              Log In
            </Link>
            <Link
              href="/auth/register"
              className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="flex flex-1 flex-col">
        <section className="mx-auto flex max-w-6xl flex-1 flex-col items-center justify-center px-6 py-24 text-center">
          <h1 className="max-w-2xl text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            Buy &amp; Sell Laptops with Confidence
          </h1>
          <p className="mt-4 max-w-xl text-lg text-gray-600">
            A trusted marketplace for laptops — whether you&apos;re upgrading, selling, or looking for the best deal. Verified sellers, secure transactions, and a community you can rely on.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/api/listings"
              className="rounded-md bg-gray-900 px-6 py-3 text-sm font-medium text-white hover:bg-gray-800"
            >
              Browse Listings
            </Link>
            <Link
              href="/auth/register"
              className="rounded-md border border-gray-300 bg-white px-6 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Start Selling
            </Link>
          </div>
        </section>

        {/* Features */}
        <section className="border-t border-gray-200 bg-white py-20">
          <div className="mx-auto max-w-6xl px-6">
            <h2 className="text-center text-2xl font-bold text-gray-900">
              How It Works
            </h2>
            <div className="mt-12 grid gap-8 sm:grid-cols-3">
              <div className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-xl">
                  1
                </div>
                <h3 className="mt-4 text-lg font-semibold text-gray-900">Create an Account</h3>
                <p className="mt-2 text-sm text-gray-600">
                  Sign up for free and set up your profile in seconds.
                </p>
              </div>
              <div className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-xl">
                  2
                </div>
                <h3 className="mt-4 text-lg font-semibold text-gray-900">List or Browse</h3>
                <p className="mt-2 text-sm text-gray-600">
                  Apply to become a verified seller or browse listings from trusted vendors.
                </p>
              </div>
              <div className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-xl">
                  3
                </div>
                <h3 className="mt-4 text-lg font-semibold text-gray-900">Buy &amp; Sell Safely</h3>
                <p className="mt-2 text-sm text-gray-600">
                  Every transaction is tracked. Sellers are verified. Admins keep the platform clean.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Role highlights */}
        <section className="border-t border-gray-200 py-20">
          <div className="mx-auto max-w-6xl px-6">
            <h2 className="text-center text-2xl font-bold text-gray-900">
              Built for Everyone
            </h2>
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  role: "Buyer",
                  desc: "Browse listings, place orders, leave reviews, and track purchases.",
                },
                {
                  role: "Seller",
                  desc: "List laptops, manage inventory, process orders, and grow your business.",
                },
                {
                  role: "Admin",
                  desc: "Moderate users, review seller applications, and handle reports.",
                },
                {
                  role: "Super Admin",
                  desc: "Full platform control — manage roles, view audit logs, and export data.",
                },
              ].map((item) => (
                <div
                  key={item.role}
                  className="rounded-lg border border-gray-200 bg-white p-6"
                >
                  <h3 className="text-lg font-semibold text-gray-900">{item.role}</h3>
                  <p className="mt-2 text-sm text-gray-600">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white py-8">
        <div className="mx-auto max-w-6xl px-6 text-center text-sm text-gray-500">
          <p>&copy; {new Date().getFullYear()} LaptopMarket. All rights reserved.</p>
          <p className="mt-1">
            RBAC-powered marketplace built with Next.js, NextAuth, and Prisma.
          </p>
        </div>
      </footer>
    </div>
  );
}
