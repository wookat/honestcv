// What a dialog renders while it animates closed: the children of its last open render,
// not the ones computed from the state its confirm handler has just cleared.
export function closingChildren<T>(open: boolean | undefined, current: T, lastOpen: T): T {
  return open === false ? lastOpen : current
}
