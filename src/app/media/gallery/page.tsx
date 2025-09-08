"use client";

import { useState, useEffect } from "react";

// Image type
type GalleryImage = {
  id: string;
  src: string;
  alt: string;
  caption: string;
  order: number;
};

// Default images for initial state
const defaultImages: GalleryImage[] = [
  {
    id: "1",
    src: "/images/gallery/image1.jpg",
    alt: "Gallery Image 1",
    caption: "Caption for image 1",
    order: 0
  },
  {
    id: "2",
    src: "/images/gallery/image2.jpg",
    alt: "Gallery Image 2", 
    caption: "Caption for image 2",
    order: 1
  },
  {
    id: "3",
    src: "/images/gallery/image3.jpg",
    alt: "Gallery Image 3",
    caption: "Caption for image 3",
    order: 2
  }
];

export default function GalleryPage() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [images, setImages] = useState<GalleryImage[]>(defaultImages);
  const [isAdmin, setIsAdmin] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [draggedItem, setDraggedItem] = useState<number | null>(null);

  // Check if user is admin on mount
  useEffect(() => {
    checkAdminStatus();
    loadImages();
  }, []);

  const checkAdminStatus = async () => {
    try {
      const res = await fetch('/api/admin/check');
      if (res.ok) {
        setIsAdmin(true);
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
    }
  };

  const loadImages = async () => {
    // In a real app, this would load from a database
    const stored = localStorage.getItem('gallery-images');
    if (stored) {
      setImages(JSON.parse(stored));
    }
  };

  const saveImages = (newImages: GalleryImage[]) => {
    // In a real app, this would save to a database
    localStorage.setItem('gallery-images', JSON.stringify(newImages));
    setImages(newImages);
  };

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? images.length - 1 : prevIndex - 1
    );
  };

  const goToNext = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === images.length - 1 ? 0 : prevIndex + 1
    );
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  // Admin functions
  const addImage = () => {
    const newImage: GalleryImage = {
      id: Date.now().toString(),
      src: prompt("Enter image URL:") || "",
      alt: prompt("Enter image alt text:") || "New Image",
      caption: prompt("Enter image caption:") || "",
      order: images.length
    };
    
    if (newImage.src) {
      saveImages([...images, newImage]);
    }
  };

  const deleteImage = (id: string) => {
    if (confirm("Are you sure you want to delete this image?")) {
      const newImages = images.filter(img => img.id !== id);
      // Reorder remaining images
      const reordered = newImages.map((img, index) => ({
        ...img,
        order: index
      }));
      saveImages(reordered);
      
      // Adjust current index if needed
      if (currentIndex >= reordered.length && reordered.length > 0) {
        setCurrentIndex(reordered.length - 1);
      }
    }
  };

  // Drag and drop handlers
  const handleDragStart = (index: number) => {
    setDraggedItem(index);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (dropIndex: number) => {
    if (draggedItem === null) return;
    
    const draggedImage = images[draggedItem];
    const newImages = [...images];
    
    // Remove dragged item
    newImages.splice(draggedItem, 1);
    
    // Insert at new position
    newImages.splice(dropIndex, 0, draggedImage);
    
    // Update order
    const reordered = newImages.map((img, index) => ({
      ...img,
      order: index
    }));
    
    saveImages(reordered);
    setDraggedItem(null);
  };

  if (images.length === 0) {
    return (
      <div style={{
        maxWidth: "900px",
        margin: "0 auto",
        padding: "4rem 1rem",
        textAlign: "center"
      }}>
        <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🖼️</div>
        <p style={{ color: "#6b7280", marginBottom: "2rem" }}>No images in gallery</p>
        {isAdmin && (
          <button
            onClick={addImage}
            style={{
              background: "linear-gradient(135deg, #8aa5d6 0%, #6b8cc9 100%)",
              color: "#fff",
              border: "none",
              padding: "0.75rem 1.5rem",
              borderRadius: "8px",
              fontWeight: 600,
              cursor: "pointer"
            }}
          >
            Add First Image
          </button>
        )}
      </div>
    );
  }

  return (
    <div style={{
      maxWidth: "1200px",
      margin: "0 auto",
      padding: "2rem 1rem"
    }}>
      {/* Admin Controls */}
      {isAdmin && (
        <div style={{
          marginBottom: "2rem",
          padding: "1rem",
          background: "linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)",
          borderRadius: "12px",
          display: "flex",
          gap: "1rem",
          alignItems: "center",
          flexWrap: "wrap"
        }}>
          <button
            onClick={() => setEditMode(!editMode)}
            style={{
              background: editMode 
                ? "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)"
                : "linear-gradient(135deg, #8aa5d6 0%, #6b8cc9 100%)",
              color: "#fff",
              border: "none",
              padding: "0.5rem 1rem",
              borderRadius: "6px",
              fontWeight: 500,
              cursor: "pointer",
              fontSize: "0.875rem"
            }}
          >
            {editMode ? "Exit Edit Mode" : "Edit Gallery"}
          </button>
          
          {editMode && (
            <>
              <button
                onClick={addImage}
                style={{
                  background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                  color: "#fff",
                  border: "none",
                  padding: "0.5rem 1rem",
                  borderRadius: "6px",
                  fontWeight: 500,
                  cursor: "pointer",
                  fontSize: "0.875rem"
                }}
              >
                + Add Image
              </button>
              <span style={{
                color: "#6b7280",
                fontSize: "0.875rem",
                fontStyle: "italic"
              }}>
                Drag thumbnails below to reorder
              </span>
            </>
          )}
        </div>
      )}

      {/* Carousel Container */}
      <div style={{
        position: "relative",
        width: "100%",
        maxWidth: "900px",
        margin: "0 auto",
        backgroundColor: "#f9fafb",
        borderRadius: "16px",
        overflow: "hidden",
        boxShadow: "0 10px 30px rgba(0, 0, 0, 0.1)"
      }}>
        
        {/* Main Image Display */}
        <div style={{
          position: "relative",
          width: "100%",
          height: "600px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)"
        }}>
          {/* Delete button for current image */}
          {isAdmin && editMode && (
            <button
              onClick={() => deleteImage(images[currentIndex].id)}
              style={{
                position: "absolute",
                top: "20px",
                right: "20px",
                background: "rgba(239, 68, 68, 0.9)",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                padding: "0.5rem 1rem",
                fontWeight: 600,
                cursor: "pointer",
                zIndex: 20,
                fontSize: "0.875rem"
              }}
            >
              Delete This Image
            </button>
          )}
          
          {/* Placeholder for actual image */}
          <div style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            textAlign: "center",
            padding: "2rem"
          }}>
            <div style={{
              fontSize: "4rem",
              marginBottom: "1rem",
              opacity: 0.8
            }}>
              🖼️
            </div>
            <div style={{
              fontSize: "1.5rem",
              fontWeight: 600,
              marginBottom: "0.5rem"
            }}>
              {images[currentIndex].alt}
            </div>
            <div style={{
              fontSize: "0.875rem",
              opacity: 0.7,
              fontStyle: "italic"
            }}>
              {images[currentIndex].caption}
            </div>
            <div style={{
              marginTop: "2rem",
              padding: "0.5rem 1rem",
              background: "rgba(255, 255, 255, 0.1)",
              borderRadius: "8px",
              fontSize: "0.75rem"
            }}>
              {/* This is where the actual image would go */}
              Replace with: Image src="{images[currentIndex].src}"
            </div>
          </div>
        </div>

        {/* Navigation Arrows */}
        <button
          onClick={goToPrevious}
          style={{
            position: "absolute",
            top: "50%",
            left: "20px",
            transform: "translateY(-50%)",
            background: "rgba(255, 255, 255, 0.9)",
            border: "none",
            borderRadius: "50%",
            width: "50px",
            height: "50px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            fontSize: "1.5rem",
            fontWeight: "bold",
            color: "#374151",
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
            transition: "all 0.3s ease",
            zIndex: 10
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#fff";
            e.currentTarget.style.transform = "translateY(-50%) scale(1.1)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(255, 255, 255, 0.9)";
            e.currentTarget.style.transform = "translateY(-50%) scale(1)";
          }}
          aria-label="Previous image"
        >
          ‹
        </button>

        <button
          onClick={goToNext}
          style={{
            position: "absolute",
            top: "50%",
            right: "20px",
            transform: "translateY(-50%)",
            background: "rgba(255, 255, 255, 0.9)",
            border: "none",
            borderRadius: "50%",
            width: "50px",
            height: "50px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            fontSize: "1.5rem",
            fontWeight: "bold",
            color: "#374151",
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
            transition: "all 0.3s ease",
            zIndex: 10
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#fff";
            e.currentTarget.style.transform = "translateY(-50%) scale(1.1)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(255, 255, 255, 0.9)";
            e.currentTarget.style.transform = "translateY(-50%) scale(1)";
          }}
          aria-label="Next image"
        >
          ›
        </button>

        {/* Dots Indicator */}
        <div style={{
          position: "absolute",
          bottom: "20px",
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          gap: "10px",
          zIndex: 10
        }}>
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              style={{
                width: currentIndex === index ? "30px" : "10px",
                height: "10px",
                border: "none",
                borderRadius: "5px",
                background: currentIndex === index 
                  ? "linear-gradient(135deg, #d4af37 0%, #b8941f 100%)"
                  : "rgba(255, 255, 255, 0.5)",
                cursor: "pointer",
                transition: "all 0.3s ease",
                boxShadow: currentIndex === index 
                  ? "0 2px 4px rgba(212, 175, 55, 0.3)"
                  : "none"
              }}
              aria-label={`Go to image ${index + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Thumbnail Grid */}
      <div style={{
        marginTop: "3rem",
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
        gap: "1rem",
        maxWidth: "900px",
        margin: "3rem auto 0"
      }}>
        {images.map((image, index) => (
          <button
            key={image.id}
            onClick={() => !editMode && goToSlide(index)}
            draggable={editMode}
            onDragStart={() => editMode && handleDragStart(index)}
            onDragOver={handleDragOver}
            onDrop={() => editMode && handleDrop(index)}
            style={{
              position: "relative",
              aspectRatio: "1",
              background: "linear-gradient(135deg, #e5e7eb 0%, #d1d5db 100%)",
              border: currentIndex === index ? "3px solid #d4af37" : "3px solid transparent",
              borderRadius: "12px",
              overflow: "hidden",
              cursor: editMode ? "move" : "pointer",
              transition: "all 0.3s ease",
              boxShadow: currentIndex === index 
                ? "0 4px 8px rgba(212, 175, 55, 0.3)"
                : "0 2px 4px rgba(0, 0, 0, 0.1)",
              opacity: draggedItem === index ? 0.5 : 1
            }}
            onMouseEnter={(e) => {
              if (currentIndex !== index && !editMode) {
                e.currentTarget.style.transform = "scale(1.05)";
                e.currentTarget.style.boxShadow = "0 6px 12px rgba(0, 0, 0, 0.15)";
              }
            }}
            onMouseLeave={(e) => {
              if (currentIndex !== index && !editMode) {
                e.currentTarget.style.transform = "scale(1)";
                e.currentTarget.style.boxShadow = "0 2px 4px rgba(0, 0, 0, 0.1)";
              }
            }}
          >
            <div style={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "2rem",
              color: "#6b7280"
            }}>
              🖼️
            </div>
            {currentIndex === index && (
              <div style={{
                position: "absolute",
                inset: 0,
                background: "linear-gradient(135deg, rgba(212, 175, 55, 0.2) 0%, rgba(184, 148, 31, 0.2) 100%)",
                pointerEvents: "none"
              }} />
            )}
            {editMode && (
              <div style={{
                position: "absolute",
                top: "4px",
                right: "4px",
                background: "rgba(0, 0, 0, 0.7)",
                color: "#fff",
                borderRadius: "4px",
                padding: "2px 6px",
                fontSize: "0.75rem",
                fontWeight: 500
              }}>
                #{index + 1}
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
