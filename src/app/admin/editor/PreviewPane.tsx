"use client";

import { formatDate } from "@/lib/date";

export default function PreviewPane({ 
  title, 
  html, 
  slug,
  isPublished = false 
}: { 
  title: string; 
  html: string; 
  slug: string;
  isPublished?: boolean;
}) {
  const currentDate = new Date().toISOString();
  
  return (
    <div style={{
      padding: "1.5rem",
      background: "#fff",
      minHeight: "400px",
      maxWidth: "800px",
      margin: "0 auto"
    }}>
      {/* Status Badge */}
      <div style={{ marginBottom: "1rem" }}>
        <span style={{
          padding: "0.25rem 0.5rem",
          background: isPublished ? "#10b981" : "#f59e0b",
          color: "#fff",
          borderRadius: 4,
          fontSize: 12,
          fontWeight: 500
        }}>
          {isPublished ? "Published" : "Draft"}
        </span>
      </div>
      
      {/* Post Title */}
      <h1 style={{
        fontSize: "2rem",
        marginBottom: "0.5rem",
        fontWeight: 600,
        lineHeight: 1.2
      }}>
        {title || "Untitled Post"}
      </h1>
      
      {/* Post Metadata */}
      <div style={{ 
        color: "var(--color-muted)", 
        marginBottom: "1.5rem",
        fontSize: "0.875rem"
      }}>
        {formatDate(currentDate)} • Slug: <code>{slug || "(auto)"}</code>
      </div>
      
      {/* Post Content */}
      <div 
        className="post-content" 
        dangerouslySetInnerHTML={{ __html: html || "<p style='color: var(--color-muted)'>Start writing to see the preview...</p>" }} 
        style={{
          lineHeight: 1.6,
          fontSize: "1rem"
        }}
      />
    </div>
  );
}
