import "./globals.scss";

export const metadata = {
  title: "YT-Study",
  description: "Study Player",
};


export default function RootLayout({ children }) {
  return (
    <html lang="en" data-theme="dark">
      <body>
        {children}
      </body>
    </html>
  );
}
