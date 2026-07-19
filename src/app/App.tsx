/** App — root application component. */

import { MainLayout } from '../shared/layouts/MainLayout';
import { ClipboardList, ClipboardPreview } from '../features/clipboard';
import { SearchBar } from '../features/search';

/** Root application component. */
export function App() {
  return (
    <MainLayout>
      <div className="flex flex-col w-full h-full">
        <header className="flex items-center gap-2 px-4 py-2 border-b border-border">
          <SearchBar />
        </header>
        <main className="flex flex-1 overflow-hidden">
          <ClipboardList />
          <ClipboardPreview />
        </main>
      </div>
    </MainLayout>
  );
}
