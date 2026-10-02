export default function LicensesPage() {
  return (
    <main>
      <h1>Licencias y avisos legales</h1>
      <p>
        Avisos de copyright y licencias de CristoFinance y sus dependencias de
        producción. Los informes incluyen los textos de licencia disponibles
        para cada paquete.
      </p>
      <ul>
        <li>
          <a href="/licenses/critol-finance-MIT.txt">CristoFinance (MIT)</a>
        </li>
        <li>
          <a href="/licenses/frontend.txt">
            Frontend web y dependencias Capacitor (npm)
          </a>
        </li>
        <li>
          <a href="/licenses/backend.txt">Backend y dependencias (npm)</a>
        </li>
        <li>
          <a href="/licenses/native-platforms.txt">
            Dependencias nativas de Android y iOS
          </a>
        </li>
        <li>
          <a href="/licenses/Apache-2.0.txt">Texto completo de Apache-2.0</a>
        </li>
      </ul>
      <p>
        Los informes de dependencias se generan desde las versiones instaladas.
        Las dependencias nativas descritas en el aviso se deben revisar cuando
        cambien los proyectos Android o iOS.
      </p>
    </main>
  );
}
