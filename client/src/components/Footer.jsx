import React from "react";
import { FaGithub, FaTwitter, FaLinkedin } from "react-icons/fa";
import "../index.css"

export function Footer() {
  return (
    <footer className="footer">
      <div className="footer-icons">

        <a href="#" className="github">
          <FaGithub size={20} />
        </a>

        <a href="#" className="twitter">
          <FaTwitter size={20} />
        </a>

        <a href="#" className="linkedin">
          <FaLinkedin size={20} />
        </a>

      </div>

      <p className="footer-text">
        Data fetched from coding platforms • Personal Project
      </p>

      <p className="footer-copy">
        © {new Date().getFullYear()} Coding Dashboard. Built with React.
      </p>
    </footer>
  );
}