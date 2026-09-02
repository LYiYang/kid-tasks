import { createHashRouter } from 'react-router-dom';
import { StoreProvider } from '../store/StoreContext';
import { AppLayout } from '../layouts/AppLayout';
import { HomePage } from '../pages/HomePage';
import { TasksPage } from '../pages/TasksPage';
import { WeekPage } from '../pages/WeekPage';
import { RewardsPage } from '../pages/RewardsPage';
import { SettingsPage } from '../pages/SettingsPage';
import { MembersPage } from '../pages/MembersPage';
import { NotFoundPage } from '../pages/NotFoundPage';

export const router = createHashRouter([
  {
    path: '/',
    element: (
      <StoreProvider>
        <AppLayout />
      </StoreProvider>
    ),
    children: [
      { index: true, element: <HomePage /> },
      { path: 'week', element: <WeekPage /> },
      { path: 'tasks', element: <TasksPage /> },
      { path: 'rewards', element: <RewardsPage /> },
      { path: 'members', element: <MembersPage /> },
      { path: 'settings', element: <SettingsPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
