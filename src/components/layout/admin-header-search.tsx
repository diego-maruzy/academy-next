"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { searchAdminAction } from "@/lib/actions/search-actions";
import {
  ADMIN_SEARCH_TYPE_LABELS,
  type AdminSearchResult,
} from "@/lib/search/admin-search";

export function AdminHeaderSearch() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AdminSearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const trimmedQuery = query.trim();

    if (trimmedQuery.length < 2) {
      return;
    }

    const timeout = window.setTimeout(() => {
      startTransition(async () => {
        const items = await searchAdminAction(trimmedQuery);
        setResults(items);
        setOpen(true);
      });
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [query]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSelect(result: AdminSearchResult) {
    setOpen(false);
    setQuery("");
    setResults([]);
    router.push(result.href);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      setOpen(false);
      return;
    }

    if (event.key === "Enter" && results[0]) {
      event.preventDefault();
      handleSelect(results[0]);
    }
  }

  const showDropdown = open && query.trim().length >= 2;

  return (
    <div ref={containerRef} className="relative hidden w-full md:block">
      <label className="flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-slate-950 px-4 text-sm text-slate-500 shadow-inner shadow-black/30">
        <Search className="h-4 w-4 shrink-0" />
        <input
          type="search"
          value={query}
          onChange={(event) => {
            const value = event.target.value;
            setQuery(value);

            if (value.trim().length < 2) {
              setResults([]);
              setOpen(false);
            }
          }}
          onFocus={() => {
            if (results.length > 0) {
              setOpen(true);
            }
          }}
          onKeyDown={handleKeyDown}
          className="w-full bg-transparent text-slate-200 outline-none placeholder:text-slate-500"
          placeholder="Buscar programas, clientes, páginas..."
          aria-label="Buscar"
        />
      </label>

      {showDropdown ? (
        <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 overflow-hidden rounded-xl border border-white/10 bg-[#0B1220] shadow-2xl shadow-black/40">
          {isPending ? (
            <p className="px-4 py-3 text-sm text-slate-400">Buscando...</p>
          ) : results.length === 0 ? (
            <p className="px-4 py-3 text-sm text-slate-400">
              Nenhum resultado encontrado.
            </p>
          ) : (
            <ul>
              {results.map((result) => (
                <li key={`${result.type}-${result.id}`}>
                  <button
                    type="button"
                    onClick={() => handleSelect(result)}
                    className="flex w-full flex-col gap-0.5 px-4 py-3 text-left transition hover:bg-white/5"
                  >
                    <span className="text-sm font-medium text-white">
                      {result.title}
                    </span>
                    <span className="text-xs text-slate-500">
                      {ADMIN_SEARCH_TYPE_LABELS[result.type]}
                      {result.subtitle ? ` · ${result.subtitle}` : ""}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
