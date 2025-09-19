import React from 'react';

const Dashboard = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold">Your Dashboard</h1>
      <p className="text-muted-foreground mt-2">Welcome to your personal space. Here you'll find your saved jobs and personalized recommendations.</p>
      {/* Placeholder for dashboard content */}
      <div className="mt-8 border-2 border-dashed border-muted rounded-lg p-12 text-center">
        <p className="text-muted-foreground">Dashboard content will appear here.</p>
      </div>
    </div>
  );
};

export default Dashboard;
