return (
    <div className="relative">
      <div>
        <header className="fixed top-0 right-0 left-0 lg:left-[250px] flex items-center px-6 lg:pr-0 pr-16 py-2 bg-[#18181b] z-10">
          <div className="relative w-[320px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks..."
              className="w-full pl-9 pr-3 py-1.5 bg-zinc-900/50 border border-zinc-800 rounded-md text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/20"
            />
          </div>
          <div className="flex-1" />
          <Button
            onClick={() => setShowCreateDialog(true)}
            margin="responsive"
            className="bg-blue-500 text-white hover:bg-blue-600 whitespace-nowrap"
          >
            Create Task
          </Button>
        </header>

        <main className="pt-[52px] px-4">
        </main>
      </div>
    </div> 