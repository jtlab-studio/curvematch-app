import React from 'react';
import { useForm } from 'react-hook-form';
import { useLibrary } from '../hooks/useLibrary';
import Modal from '../../common/components/Modal';
import Input from '../../common/components/Input';
import Button from '../../common/components/Button';

interface SaveModalProps {
  route: any;
  isOpen: boolean;
  onClose: () => void;
}

interface SaveFormData {
  name: string;
}

const SaveModal: React.FC<SaveModalProps> = ({ route, isOpen, onClose }) => {
  const { saveRoute } = useLibrary();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<SaveFormData>();

  const handleSave = async (data: SaveFormData) => {
    try {
      await saveRoute(route, data.name);
      reset();
      onClose();
    } catch (error) {
      console.error('Save failed:', error);
    }
  };

  const handleCancel = () => {
    reset();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleCancel} title="Save Route">
      <form onSubmit={handleSubmit(handleSave)} className="space-y-4">
        <div className="text-sm text-gray-600">
          <p>Distance: {(route.distance / 1000).toFixed(1)} km</p>
          <p>Elevation Gain: {route.elevationGain} m</p>
          <p>Match Score: {route.matchPercentage}%</p>
        </div>

        <Input
          label="Route Name"
          {...register('name', { required: 'Route name is required' })}
          error={errors.name?.message}
          placeholder="Enter a name for this route"
          autoFocus
        />

        <div className="flex gap-2">
          <Button type="submit" isLoading={isSubmitting}>
            Save
          </Button>
          <Button type="button" variant="secondary" onClick={handleCancel}>
            Cancel
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default SaveModal;
