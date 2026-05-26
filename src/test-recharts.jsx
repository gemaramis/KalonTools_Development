import React from 'react';
import { renderToString } from 'react-dom/server';
import { LineChart, Line, XAxis, YAxis } from 'recharts';

const data = [
  { name: 'A', value: 100 },
  { name: 'B', value: 50 },
  { name: 'C', value: 0 },
  { name: 'D', value: 0 },
  { name: 'E', value: 20 },
];

console.log(renderToString(
  <LineChart width={400} height={400} data={data}>
    <YAxis scale="sqrt" domain={[0, 'auto']} />
    <Line type="monotone" dataKey="value" />
  </LineChart>
));
