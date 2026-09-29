export function ThemeInit() {
  return (
    <script>
      {`
                const savedTheme = localStorage.getItem("theme");
                const theme = savedTheme === "light" || savedTheme === "dark" ? savedTheme : window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
                document.documentElement.classList.add(theme);
            `}
    </script>
  );
}
