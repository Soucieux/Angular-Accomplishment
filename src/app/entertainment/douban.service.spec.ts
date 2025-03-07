import { TestBed } from '@angular/core/testing';

import { DoubanService } from './douban.service';

describe('DoubanService', () => {
  let service: DoubanService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DoubanService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
