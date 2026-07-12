import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, Plus, Heart, ChevronDown } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Dashboard,
  head: () => ({
    meta: [
      { title: "FastCredit — Dashboard" },
      { name: "description", content: "FastCredit dashboard: manage your balance, pools, and upgrades." },
    ],
  }),
});

const CURRENCIES = [
  { code: "NGN", symbol: "₦", rate: 1600 },
  { code: "USD", symbol: "$", rate: 1.27 },
  { code: "EUR", symbol: "€", rate: 1.17 },
  { code: "ZAR", symbol: "R", rate: 23.5 },
  { code: "GHS", symbol: "₵", rate: 19.2 },
  { code: "CFA", symbol: "CFA ", rate: 765 },
  { code: "GBP", symbol: "£", rate: 1 },
];

function Dashboard() {
  const [currency, setCurrency] = useState(CURRENCIES[6]);
  const [open, setOpen] = useState(false);

  const fmt = (gbp: number) => {
    const v = gbp * currency.rate;
    return `${currency.symbol}${v.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <div className="min-h-screen bg-[#eef0f4] px-5 pb-10 pt-6">
      {/* Header */}
      <header className="mb-6 flex items-center justify-between">
        <button className="grid h-11 w-11 place-items-center rounded-full bg-white shadow-sm">
          <Menu className="h-5 w-5" />
        </button>
        <h1 className="text-2xl font-extrabold tracking-tight">Accounts</h1>
        <div className="relative">
          <button
            onClick={() => setOpen((o) => !o)}
            className="flex items-center gap-1 rounded-full bg-white px-3 h-11 shadow-sm text-sm font-semibold"
          >
            {currency.code}
            <ChevronDown className="h-4 w-4" />
          </button>
          {open && (
            <div className="absolute right-0 mt-2 w-36 rounded-xl bg-white shadow-lg z-10 overflow-hidden">
              {CURRENCIES.map((c) => (
                <button
                  key={c.code}
                  onClick={() => {
                    setCurrency(c);
                    setOpen(false);
                  }}
                  className={`w-full px-4 py-2.5 text-left text-sm hover:bg-[#eef0f4] ${
                    c.code === currency.code ? "font-bold" : ""
                  }`}
                >
                  {c.symbol} {c.code}
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* Balance card */}
      <section className="rounded-3xl bg-white p-6 shadow-sm">
        <p className="font-bold">FastCredit balance</p>
        <p className="mt-6 text-5xl font-extrabold tracking-tight">{fmt(43)}</p>
        <div className="mt-6 flex gap-3">
          <button className="flex-1 rounded-full border border-gray-300 py-4 font-bold">
            Transfer
          </button>
          <button className="flex-1 rounded-full bg-black py-4 font-bold text-white">
            Upgrade
          </button>
        </div>
      </section>

      {/* Row of two cards */}
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="rounded-3xl bg-white p-5 shadow-sm min-h-[190px] flex flex-col justify-between">
          <p className="text-sm">Pools</p>
          <div>
            <span className="inline-block rounded-md bg-emerald-100 px-2 py-1 text-xs text-emerald-800">
              Total in 2 pools
            </span>
            <p className="mt-2 text-2xl font-extrabold">{fmt(120)}</p>
          </div>
        </div>
        <div className="rounded-3xl bg-white p-5 shadow-sm min-h-[190px] flex flex-col justify-between">
          <p className="text-sm">Pay in 3</p>
          <div>
            <span className="inline-block rounded-md bg-amber-100 px-2 py-1 text-xs text-amber-900">
              {fmt(22.33)} due June 15
            </span>
            <p className="mt-2 text-2xl font-extrabold">{fmt(293.19)}</p>
            <p className="text-xs text-gray-500">Total outstanding</p>
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="rounded-3xl bg-black p-5 text-white shadow-sm min-h-[190px] flex flex-col justify-between">
          <div>
            <p className="text-xs">FastCredit Fundraisers</p>
            <p className="mt-2 text-xl font-bold">Support a cause</p>
          </div>
          <div className="flex items-end justify-between">
            <Heart className="h-10 w-10 text-blue-500" strokeWidth={2.5} />
            <button className="grid h-9 w-9 place-items-center rounded-full bg-white/20">
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="rounded-3xl bg-blue-500 p-5 text-white shadow-sm min-h-[190px] flex flex-col justify-between">
          <div>
            <p className="text-xs">Pools</p>
            <p className="mt-2 text-xl font-bold">Pool money with friends</p>
          </div>
          <div className="flex items-end justify-between">
            <div className="flex -space-x-2">
              <div className="h-7 w-7 rounded-full bg-pink-300 border-2 border-blue-500" />
              <div className="h-7 w-7 rounded-full bg-amber-300 border-2 border-blue-500" />
              <div className="h-7 w-7 rounded-full bg-emerald-300 border-2 border-blue-500" />
            </div>
            <button className="grid h-9 w-9 place-items-center rounded-full bg-white/30">
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
