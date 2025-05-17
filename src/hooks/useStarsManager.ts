
import { useState, useEffect } from 'react';

const useStarsManager = () => {
  const [stars, setStars] = useState(() => {
    const savedStars = localStorage.getItem('eduAppStars');
    return savedStars ? parseInt(savedStars) : 0;
  });

  // Save stars to localStorage when they change
  useEffect(() => {
    localStorage.setItem('eduAppStars', stars.toString());
  }, [stars]);

  const addStars = (amount: number) => {
    setStars(current => current + amount);
  };

  return { stars, addStars, setStars };
};

export default useStarsManager;
