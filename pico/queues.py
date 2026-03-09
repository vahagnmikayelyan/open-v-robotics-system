import uasyncio as asyncio

class Queue:
    def __init__(self):
        self._queue = []
        self._ev = asyncio.Event()

    def put_nowait(self, val):
        self._queue.append(val)
        self._ev.set()

    async def put(self, val):
        self.put_nowait(val)
        await asyncio.sleep(0) # Allow change task

    async def get(self):
        while not self._queue:
            self._ev.clear()
            await self._ev.wait()
        return self._queue.pop(0)

    def empty(self):
        return len(self._queue) == 0