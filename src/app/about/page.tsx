import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About — Dave's Site",
};

export default function AboutPage() {
  return (
    <section>
      <h2>About</h2>
      <p>
        This is a short introduction to Dave. Replace this with a proper bio, background,
        and what this site is about.
      </p>
    </section>
  );
}

