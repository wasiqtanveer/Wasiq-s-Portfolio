import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiHome, FiUser, FiCode, FiActivity, FiMail } from 'react-icons/fi';
import './SideNav.css';

const navItems = [
    { id: 'home', icon: <FiHome />, label: 'Home' },
    { id: 'about', icon: <FiUser />, label: 'About' },
    { id: 'projects', icon: <FiCode />, label: 'Projects' },
    { id: 'skills', icon: <FiActivity />, label: 'Skills' },
    { id: 'contact', icon: <FiMail />, label: 'Contact' },
];

const SideNav = ({ activeSection = 'home' }) => {
    const [hoveredLink, setHoveredLink] = useState(null);

    const scrollToSection = (id) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <nav className="side-nav">
            <ul className="nav-list">
                {navItems.map((item) => {
                    const isActive = activeSection === item.id;
                    return (
                        <li
                            key={item.id}
                            className="nav-item hover-target"
                            onMouseEnter={() => setHoveredLink(item.id)}
                            onMouseLeave={() => setHoveredLink(null)}
                            onClick={() => scrollToSection(item.id)}
                        >
                            <div className={`nav-icon ${isActive ? 'active' : ''}`}>
                                {item.icon}
                            </div>

                            <motion.div
                                className="nav-label"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{
                                    opacity: hoveredLink === item.id ? 1 : 0,
                                    x: hoveredLink === item.id ? 0 : 20
                                }}
                                transition={{ duration: 0.2 }}
                            >
                                {item.label}
                            </motion.div>

                            {isActive && (
                                <motion.div
                                    className="active-indicator"
                                    layoutId="activeIndicator"
                                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                />
                            )}
                        </li>
                    );
                })}
            </ul>
            <div className="nav-line"></div>
        </nav>
    );
};

export default SideNav;
