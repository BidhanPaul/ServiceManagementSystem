// src/components/charts/UserRolePieChart.js
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

      const roles = {};
      res.data.forEach((u) => {
        roles[u.role] = (roles[u.role] || 0) + 1;
      });

      setData(
        Object.entries(roles).map(([role, count]) => ({
          name: role,
          value: count,
        }))
      );
    } catch (error) {
      console.error("Pie Load Error", error);
    }
  };

  return (
    <div className="w-full h-full flex items-center justify-center">
      <PieChart width={260} height={260}>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          outerRadius={90}
          dataKey="value"
          label
        >
          {data.map((entry, index) => (
            <Cell key={index} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend
  verticalAlign="bottom"
  height={36}
  wrapperStyle={{ fontSize: "10px" }} 
/>
      </PieChart>
    </div>
  );
}
