/**
 * WalkInPresenterClientFactory
 */

import { createMachineRepository, createWalkInQueueRepository } from '@/src/infrastructure/repositories/RepositoryFactory';
import { WalkInPresenter } from './WalkInPresenter';

export function createClientWalkInPresenter(): WalkInPresenter {
  const walkInRepo = createWalkInQueueRepository();
  const machineRepo = createMachineRepository();
  
  return new WalkInPresenter(walkInRepo, machineRepo);
}
