import React, { useEffect, useState } from "react";
import API from "../../api/api";
import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts";

export default function UserRolePieChart() {
  const [data, setData] = useState([]);

  const COLORS = ["#4F7BFF", "#65C7FF", "#00C9A7", "#8A4FFF", "#FF6B6B"];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await API.get("/users");

      // Calculate role counts
      const roles = {};
      res.data.forEach(u => {
        roles[u.role] = (roles[u.role] || 0) + 1;
      });

      // Convert to chart format
      setData(
        Object.entries(roles).map(([role, count]) => ({
          name: role,
          value: count
        }))
      );
    } catch (error) {
      console.error("Pie Load Error", error);
    }
  };

  return (
    <div className="bg-white/40 backdrop-blur-xl border border-white/30 shadow-md rounded-xl p-6 w-full">
      <h2 className="text-xl font-semibold text-blue-700 mb-4">
        📊 Employees by Role
      </h2>

      <div className="flex justify-center">
        <PieChart width={350} height={300}>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            outerRadius={120}
            dataKey="value"
            label
          >
            {data.map((entry, index) => (
              <Cell key={index} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </div>
    </div>
  );
}
