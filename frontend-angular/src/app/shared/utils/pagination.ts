export interface PaginationItem { key: string; page: number | null; }

export function buildPaginationItems(currentPage: number, totalPages: number): PaginationItem[] {
  if (totalPages <= 3) return Array.from({ length: totalPages }, (_, index) => ({ key:`page-${index+1}`,page:index+1 }));
  const items: PaginationItem[] = [{key:'page-1',page:1}];
  if (currentPage > 2) items.push({key:'ellipsis-start',page:null});
  if (currentPage !== 1 && currentPage !== totalPages) items.push({key:`page-${currentPage}`,page:currentPage});
  if (currentPage < totalPages - 1) items.push({key:'ellipsis-end',page:null});
  items.push({key:`page-${totalPages}`,page:totalPages});
  return items;
}
