import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Layout } from '../Layout';

describe('Layout', () => {
  it('ヘッダー / サイドバー / 子要素 が描画される', () => {
    render(
      <Layout
        header={<div>ヘッダー内容</div>}
        sidebar={<nav>サイドバー内容</nav>}
        logo={<span>LOGO</span>}
      >
        <div>メインコンテンツ</div>
      </Layout>,
    );
    expect(screen.getByText('ヘッダー内容')).toBeInTheDocument();
    expect(screen.getByText('サイドバー内容')).toBeInTheDocument();
    expect(screen.getByText('メインコンテンツ')).toBeInTheDocument();
    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByRole('banner')).toBeInTheDocument();
  });
});
