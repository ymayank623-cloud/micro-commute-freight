import { motion } from "framer-motion";
import { FaArrowUp, FaArrowDown } from "react-icons/fa";

function StatCard({
  title,
  value,
  subtitle,
  icon,
  color = "#2563eb",
  trend,
  trendLabel,
}) {
  const isPositive = trend >= 0;

  return (
    <motion.div
      className="premium-stat-card"
      whileHover={{
        y: -4,
        transition: { duration: 0.2 },
      }}
    >
      <div className="stat-card-top">
        <div
          className="stat-icon"
          style={{
            background: `${color}12`,
            color: color,
          }}
        >
          {icon}
        </div>

        {trend !== undefined && (
          <div
            className={`stat-trend ${
              isPositive ? "positive" : "negative"
            }`}
          >
            {isPositive ? (
              <FaArrowUp />
            ) : (
              <FaArrowDown />
            )}

            {Math.abs(trend)}%
          </div>
        )}
      </div>

      <div className="stat-card-content">
        <span className="stat-title">
          {title}
        </span>

        <strong className="stat-value">
          {value}
        </strong>

        <div className="stat-bottom">
          <span className="stat-subtitle">
            {subtitle}
          </span>

          {trendLabel && (
            <span className="stat-trend-label">
              {trendLabel}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default StatCard;