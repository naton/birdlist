function getMonthName(month, length) {
  const date = new Date();
  date.setDate(1);
  date.setMonth(month);
  return new Intl.DateTimeFormat("sv", {
    month: length ? "long" : "short",
  }).format(date);
}

function getCurrentYear(year) {
  const date = year ? new Date().setFullYear(year) : new Date();
  return new Intl.DateTimeFormat("sv", {
    year: "numeric",
  }).format(date);
}

function cssColor(string) {
  if (!string) return "";
  const hashCode = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 3) - hash + char;
      hash = hash & hash;
    }
    return hash.toString(16);
  };

  return "#" + hashCode(string).substring(2, 8);
}

function formatDate(date) {
  return new Intl.DateTimeFormat(false, {
    weekday: "long",
    day: "numeric",
    month: "short",
  }).format(date);
}

export { getMonthName, getCurrentYear, cssColor, formatDate };
