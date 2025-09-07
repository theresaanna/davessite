import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Works — Dave's Site",
};

export default function WorksPage() {
  return (
    <section>
      <h2>Works</h2>
      <p>
        A showcase of projects and selected work. Add items here as you build out the portfolio.
      </p>
    </section>
  );
}

