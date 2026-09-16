// PERITIA — Navigation Component
import { NavLink } from 'react-router-dom';

export default function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar__inner">
        <NavLink to="/" className="navbar__brand" style={{ color: 'var(--accent)' }}>
          PERITIA
        </NavLink>

        <ul className="navbar__links">
          <li>
            <NavLink
              to="/"
              end
              className={({ isActive }) => `navbar__link${isActive ? ' active' : ''}`}
            >
              Home
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/setup"
              className={({ isActive }) => `navbar__link${isActive ? ' active' : ''}`}
            >
              Setup
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/preparation"
              className={({ isActive }) => `navbar__link${isActive ? ' active' : ''}`}
            >
              Preparation
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/practice"
              className={({ isActive }) => `navbar__link${isActive ? ' active' : ''}`}
            >
              Practice
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/progress"
              className={({ isActive }) => `navbar__link${isActive ? ' active' : ''}`}
            >
              Progress
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/about"
              className={({ isActive }) => `navbar__link${isActive ? ' active' : ''}`}
            >
              About
            </NavLink>
          </li>
        </ul>
      </div>
    </nav>
  );
}
