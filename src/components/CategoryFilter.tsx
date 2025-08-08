import React from 'react';

interface CategoryFilterProps {
  categories: string[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

const CategoryFilter: React.FC<CategoryFilterProps> = ({ categories, selectedCategory, onCategoryChange }) => {
  return (
    <div className="flex items-center space-x-2">
      <label className="text-sm font-medium text-gray-300">Category:</label>
      <select
        value={selectedCategory}
        onChange={(e) => onCategoryChange(e.target.value)}
        className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 px-3 py-2"
      >
        {categories.map((category) => (
          <option key={category} value={category}>
            {category === 'all' ? 'All Categories' : category}
          </option>
        ))}
      </select>
    </div>
  );
};

export default CategoryFilter;
