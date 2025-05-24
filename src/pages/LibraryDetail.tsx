import React from 'react';
import { useParams } from 'react-router-dom';
import RouteDetail from '../modules/library/components/RouteDetail';

const LibraryDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  if (!id) {
    return <div>Route not found</div>;
  }

  return <RouteDetail />;
};

export default LibraryDetail;
