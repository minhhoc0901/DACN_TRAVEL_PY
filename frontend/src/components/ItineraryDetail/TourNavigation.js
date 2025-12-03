import React, { useEffect, useRef } from 'react';
import '../../styles/itineraryCSS/TourNavigation.css'; // Import the new CSS

const TourNavigation = ({ activeTab, setActiveTab }) => {
  const navRef = useRef(null);

  const tabs = [
    { id: 'overview', label: 'Tổng quan', icon: 'bi-card-text' },
    { id: 'schedule', label: 'Lịch trình', icon: 'bi-calendar3-week' },
    { id: 'info', label: 'Thông tin', icon: 'bi-info-circle' },
    { id: 'reviews', label: 'Đánh giá', icon: 'bi-star-half' },
    // Add other tabs if needed, e.g., Map
    // { id: 'map', label: 'Bản đồ', icon: 'bi-map' },
  ];

  // Optional: Add shadow on scroll for sticky nav
  useEffect(() => {
    const handleScroll = () => {
      if (navRef.current) {
        // Add a class if nav is sticky and scrolled past a certain point
        // This example just adds shadow if it's sticky (top > 0)
        const stickyNav = navRef.current;
        if (stickyNav.offsetTop > 0 && window.scrollY > stickyNav.offsetTop - 10) { // 10px buffer
            stickyNav.classList.add('scrolled');
        } else {
            stickyNav.classList.remove('scrolled');
        }
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);


  return (
    <section ref={navRef} className="tour-navigation-section">
      <ul className="tour-nav-tabs">
        {tabs.map(tab => (
          <li key={tab.id} className="tour-nav-item">
            <a
              href={`#${tab.id}`} // Or use button/div and onClick
              className={`tour-nav-link ${activeTab === tab.id ? 'active' : ''}`}
              onClick={(e) => {
                e.preventDefault(); // Prevent page jump
                setActiveTab(tab.id);
                // Optional: Scroll to content section if tabs and content are on the same page
                // const section = document.getElementById(`tour-tab-${tab.id}`);
                // if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
            >
              <i className={`bi ${tab.icon}`}></i>
              {tab.label}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
};

export default TourNavigation;