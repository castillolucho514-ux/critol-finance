import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { api } from "../utils/api";
import { useUser } from "../utils/useUser";

export default function Admin() {
  const { user, logout } = useUser();
  const [users, setUsers] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const load = () => {
    api("/api/admin/users").then((r) => setUsers(r.users)).catch(() => {});
    api("/api/admin/analytics").then(setStats).catch(() => {});
  };
  useEffect(() => { if (user?.role === "ADMIN") load(); }, [user]);

  if (!user) return null;
  if (user.role !== "ADMIN") return <Layout user={user} logout={logout}><p>Forbidden</p></Layout>;
  return (
    <Layout user={user} logout={logout}>
      {stats && <div className="card mb-4">Users: {stats.totalUsers} · Free {stats.byPlan.FREE} · Pro {stats.byPlan.PRO} · Premium {stats.byPlan.PREMIUM} · API: {JSON.stringify(stats.apiUsage)}</div>}
      <table className="card w-full text-left text-sm">
        <thead><tr><th>Email</th><th>Role</th><th>Plan</th></tr></thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}><td>{u.email}</td><td>{u.role}</td>
              <td><select className="bg-slate-800" value={u.plan} onChange={async (e) => { await api(`/api/admin/users/${u.id}`, { method: "PATCH", body: JSON.stringify({ plan: e.target.value }) }); load(); }}>
                <option>FREE</option><option>PRO</option><option>PREMIUM</option></select></td></tr>
          ))}
        </tbody>
      </table>
    </Layout>
  );
}
