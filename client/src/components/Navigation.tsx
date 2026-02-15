import * as React from "react";
import { Link, useLocation } from "wouter";

// Placeholder seguro: não quebra build e mantém navegação básica.
// Depois a gente deixa o menu “bonito” igual no Replit.
export function Navigation() {
  const [loc] = useLocation();

  const items = [
    { href: "/", label: "Jobs" },
    { href: "/jobs/new", label: "New Quote" },
    { href: "/schedule", label: "Agenda" },
    { href: "/stairs", label: "Escadas" },
    { href: "/settings", label: "Config" },
    { href: "/support", label: "Suporte" },
  ];

  return (
    <nav
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        background: "#fff",
        borderTop: "1px solid rgba(0,0,0,.08)",
        padding: "10px 8px",
        display: "flex",
        gap: 8,
        justifyContent: "space-between",
        zIndex: 50,
      }}
    >
      {items.map((it) => {
        const active = loc === it.href;
        return (
          <Link key={it.href} href={it.href}>
            <a
              style={{
                flex: 1,
                textAlign: "center",
                fontSize: 12,
                textDecoration: "none",
                padding: "8px 6px",
                borderRadius: 10,
                color: active ? "#0a7a3b" : "#333",
                background: active ? "rgba(10,122,59,.10)" : "transparent",
              }}
            >
              {it.label}
            </a>
          </Link>
        );
      })}
    </nav>
  );
}

export default Navigation;
