"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);
  const pathname = usePathname();
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Common serif font stack
  const serifFont = "'Georgia', 'Times New Roman', 'Cambria', serif";

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const navItems = [
    { 
      label: "About", 
      href: "/about",
      dropdown: [
        { label: "Biography", href: "/about/bio" },
        { label: "Contact", href: "/about/contact" },
      ]
    },
    { 
      label: "Works", 
      href: "/works",
      dropdown: [
        { label: "Sibling Rivalry", href: "/works/sibling-rivalry" },
      ]
    },
    { 
      label: "Blog", 
      href: "/blog",
      dropdown: [
        { label: "Recent Posts", href: "/blog" },
        { label: "Categories", href: "/blog/categories" },
        { label: "Newsletter", href: "/blog/newsletter" },
      ]
    },
    { 
      label: "Media", 
      href: "/media",
      dropdown: [
        { label: "Gallery", href: "/media/gallery" },
      ]
    },
    { 
      label: "Events", 
      href: "/events",
      dropdown: [
        { label: "Upcoming", href: "/events/upcoming" },
        { label: "Past Events", href: "/events/past" },
        { label: "Book Tour", href: "/events/tour" },
      ]
    },
  ];

  const socialLinks = [
    { name: "Facebook", icon: "f", href: "https://facebook.com" },
    { name: "Twitter", icon: "X", href: "https://twitter.com" },
    { name: "Instagram", icon: "ig", href: "https://instagram.com" },
    { name: "YouTube", icon: "▶", href: "https://youtube.com" },
  ];

  return (
    <header style={{
      background: "linear-gradient(180deg, #fff 0%, #f9fafb 100%)",
      borderBottom: "2px solid #e5e7eb",
      position: "sticky",
      top: 0,
      zIndex: 1000,
      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
      fontFamily: serifFont
    }}>
      {/* Top Bar with Social Media */}
      <div style={{
        background: "linear-gradient(135deg, #8aa5d6 0%, #7394c7 100%)",
        padding: "0.5rem 0",
        borderBottom: "1px solid rgba(255, 255, 255, 0.1)"
      }}>
        <div style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "0 2.5rem",
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center"
        }}>
          <div style={{
            display: "flex",
            gap: "1rem",
            alignItems: "center"
          }}>
            {socialLinks.map((social) => (
              <a
                key={social.name}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                title={social.name}
                style={{
                  color: "#fff",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  transition: "transform 0.2s ease, opacity 0.2s ease",
                  opacity: 0.85,
                  display: "inline-block",
                  padding: "0.25rem 0.5rem",
                  borderRadius: "4px",
                  background: "rgba(255, 255, 255, 0.1)",
                  fontFamily: serifFont
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-1px)";
                  e.currentTarget.style.opacity = "1";
                  e.currentTarget.style.background = "rgba(255, 255, 255, 0.2)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.opacity = "0.85";
                  e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
                }}
              >
                {social.icon}
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div style={{
        maxWidth: "1200px",
        margin: "0 auto",
        padding: "1.5rem 2.5rem"
      }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "2rem"
        }}>
          {/* Logo Section */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "1.5rem"
          }}>
            {/* Site Title/Logo */}
            <div>
              <h1 style={{
                fontSize: "2.25rem",
                fontWeight: 700,
                margin: 0,
                background: "linear-gradient(135deg, #8aa5d6 0%, #6b8cc9 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                letterSpacing: "-0.02em",
                fontFamily: serifFont
              }}>
                Dave's Site
              </h1>
              <div style={{
                fontSize: "0.875rem",
                color: "#6b7280",
                marginTop: "0.25rem",
                fontStyle: "italic",
                fontFamily: serifFont
              }}>
                Word Wrangler for Hire
              </div>
            </div>
          </div>

          {/* Call to Action Button */}
          <div style={{
            display: "flex",
            gap: "1rem",
            alignItems: "center"
          }}>
            <Link
              href="/works/latest"
              style={{
                background: "linear-gradient(135deg, #d4af37 0%, #b8941f 100%)",
                color: "#fff",
                padding: "0.75rem 1.5rem",
                borderRadius: "8px",
                fontWeight: 600,
                fontSize: "0.875rem",
                textDecoration: "none",
                boxShadow: "0 2px 4px rgba(212, 175, 55, 0.3)",
                transition: "all 0.3s ease",
                display: "inline-block",
                fontFamily: serifFont
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 4px 8px rgba(212, 175, 55, 0.4)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 2px 4px rgba(212, 175, 55, 0.3)";
              }}
            >
              View Latest Work
            </Link>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              style={{
                display: "none",
                background: "transparent",
                border: "none",
                fontSize: "1.5rem",
                cursor: "pointer",
                padding: "0.5rem"
              }}
              className="mobile-menu-btn"
            >
              {mobileMenuOpen ? "×" : "☰"}
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Bar */}
      <nav 
        ref={dropdownRef}
        style={{
          background: "linear-gradient(135deg, #fdf6e3 0%, #f9f0d9 100%)",
          borderTop: "1px solid #e6d5a8"
        }}
      >
        <div style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "0 2.5rem"
        }}>
          <ul style={{
            display: "flex",
            listStyle: "none",
            margin: 0,
            padding: 0,
            gap: "2rem",
            alignItems: "center",
            height: "3.5rem"
          }} className="desktop-nav">
            {navItems.map((item) => (
              <li 
                key={item.label}
                style={{ position: "relative" }}
                onMouseEnter={() => setDropdownOpen(item.label)}
                onMouseLeave={() => setDropdownOpen(null)}
              >
                  <Link
                    href={item.href}
                    style={{
                      color: pathname === item.href ? "#8aa5d6" : "#374151",
                      textDecoration: "none",
                      fontWeight: pathname === item.href ? 600 : 500,
                      fontSize: "0.9375rem",
                      padding: "0.5rem 0",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.25rem",
                      transition: "all 0.2s ease",
                      fontFamily: serifFont
                    }}
                    onMouseEnter={(e) => {
                      if (pathname !== item.href) {
                        e.currentTarget.style.color = "#fff";
                        e.currentTarget.style.backgroundColor = "#d4af37";
                        e.currentTarget.style.padding = "0.5rem 0.75rem";
                        e.currentTarget.style.borderRadius = "4px";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (pathname !== item.href) {
                        e.currentTarget.style.color = "#374151";
                        e.currentTarget.style.backgroundColor = "transparent";
                        e.currentTarget.style.padding = "0.5rem 0";
                      }
                    }}
                  >
                    {item.label}
                    <span style={{
                      fontSize: "0.625rem",
                      opacity: 0.5,
                      transform: dropdownOpen === item.label ? "rotate(180deg)" : "rotate(0)",
                      transition: "transform 0.2s ease"
                    }}>▼</span>
                  </Link>
                  
                  {/* Dropdown Menu */}
                  {dropdownOpen === item.label && item.dropdown && (
                    <>
                      {/* Invisible bridge to prevent gap */}
                      <div style={{
                        position: "absolute",
                        top: "100%",
                        left: "-1rem",
                        right: "-1rem",
                        height: "0.5rem",
                        background: "transparent"
                      }} />
                      <div style={{
                        position: "absolute",
                        top: "calc(100% + 0.5rem)",
                        left: "-1rem",
                        background: "#fff",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                        minWidth: "200px",
                        paddingTop: "0.5rem",
                        paddingBottom: "0.5rem",
                        zIndex: 1000,
                        overflow: "hidden"
                      }}>
                    {item.dropdown.map((subItem, index) => (
                      <Link
                        key={subItem.label}
                        href={subItem.href}
                        style={{
                          display: "block",
                          padding: "0.75rem 1rem",
                          color: "#374151",
                          textDecoration: "none",
                          fontSize: "0.875rem",
                          borderBottom: index < item.dropdown.length - 1 ? "1px solid #f3f4f6" : "none",
                          transition: "all 0.2s ease",
                          fontFamily: serifFont
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "#d4af37";
                          e.currentTarget.style.color = "#fff";
                          e.currentTarget.style.paddingLeft = "1.25rem";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "transparent";
                          e.currentTarget.style.color = "#374151";
                          e.currentTarget.style.paddingLeft = "1rem";
                        }}
                      >
                        {subItem.label}
                      </Link>
                    ))}
                      </div>
                    </>
                  )}
              </li>
            ))}
            
            {/* Newsletter Signup */}
            <li style={{ marginLeft: "auto" }}>
            <Link
                href="/newsletter"
                style={{
                  background: "linear-gradient(135deg, #8aa5d6 0%, #6b8cc9 100%)",
                  color: "#fff",
                  padding: "0.625rem 1.25rem",
                  borderRadius: "8px",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  textDecoration: "none",
                  display: "inline-block",
                  border: "2px solid transparent",
                  transition: "all 0.3s ease",
                  boxShadow: "0 2px 4px rgba(138, 165, 214, 0.2)",
                  fontFamily: serifFont
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 4px 8px rgba(138, 165, 214, 0.3)";
                  e.currentTarget.style.background = "linear-gradient(135deg, #95b0e0 0%, #7697d3 100%)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 2px 4px rgba(138, 165, 214, 0.2)";
                  e.currentTarget.style.background = "linear-gradient(135deg, #8aa5d6 0%, #6b8cc9 100%)";
                }}
              >
                ✉ Join Newsletter
              </Link>
            </li>
          </ul>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div style={{
              position: "absolute",
              top: "100%",
              left: 0,
              right: 0,
              background: "#fff",
              borderTop: "1px solid #e5e7eb",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
              display: "none"
            }} className="mobile-nav">
              {navItems.map((item) => (
                <div key={item.label}>
                  <Link
                    href={item.href}
                    style={{
                      display: "block",
                      padding: "1rem",
                      color: "#374151",
                      textDecoration: "none",
                      borderBottom: "1px solid #f3f4f6"
                    }}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </nav>

      <style jsx>{`
        @media (max-width: 768px) {
          .mobile-menu-btn {
            display: block !important;
          }
          .desktop-nav {
            display: none !important;
          }
          .mobile-nav {
            display: block !important;
          }
        }
      `}</style>
    </header>
  );
};

export default Header;
