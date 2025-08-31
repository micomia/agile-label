const fs = require('fs');
const path = require('path');

async function createLicensesWithText() {
  try {
    console.log('licenses.jsonを読み込み中...');
    
    // licenses.jsonを読み込み
    const licensesData = JSON.parse(fs.readFileSync('licenses.json', 'utf8'));
    console.log(`読み込み完了: ${Object.keys(licensesData).length}個のパッケージ`);

    // package.jsonから直接の依存関係を取得
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const directDeps = Object.keys(packageJson.dependencies || {});
    console.log(`直接依存関係: ${directDeps.length}個`);

    const licensesWithText = {};
    let processedCount = 0;
    let successCount = 0;
    let errorCount = 0;

    console.log('\nライセンスファイルを読み込み中...');

    for (const [packageName, info] of Object.entries(licensesData)) {
      // パッケージ名からバージョンを除去して直接依存関係かチェック
      const nameWithoutVersion = packageName.replace(/@[\d\.]+.*$/, '');
      const isDirectDep = directDeps.some(dep => 
        dep === nameWithoutVersion || 
        packageName.startsWith(dep + '@')
      );

      // 直接依存関係のみを処理
      if (!isDirectDep) continue;

      processedCount++;
      console.log(`[${processedCount}] ${packageName}を処理中...`);

      let licenseText = '';
      let licenseSource = 'template';

      // ローカルライセンスファイルを読み込み
      if (info.licenseFile && fs.existsSync(info.licenseFile)) {
        try {
          licenseText = fs.readFileSync(info.licenseFile, 'utf8');
          licenseSource = 'file';
          successCount++;
          console.log(`  ✅ ファイル読み込み成功: ${info.licenseFile}`);
        } catch (fileError) {
          console.log(`  ⚠️  ファイル読み込み失敗: ${fileError.message}`);
          licenseText = generateStandardLicenseText(info.licenses, info.publisher);
          errorCount++;
        }
      } else {
        console.log(`  ⚠️  ライセンスファイルが存在しません: ${info.licenseFile}`);
        licenseText = generateStandardLicenseText(info.licenses, info.publisher);
        errorCount++;
      }

      licensesWithText[packageName] = {
        ...info,
        licenseText: licenseText,
        licenseSource: licenseSource,
        textLength: licenseText.length
      };
    }

    // 結果をファイルに保存
    const outputFileName = 'licenses-with-full-text.json';
    fs.writeFileSync(outputFileName, JSON.stringify(licensesWithText, null, 2));

    console.log('\n=== 処理完了 ===');
    console.log(`処理したパッケージ数: ${processedCount}`);
    console.log(`ファイル読み込み成功: ${successCount}`);
    console.log(`テンプレート使用: ${errorCount}`);
    console.log(`成功率: ${((successCount / processedCount) * 100).toFixed(1)}%`);
    console.log(`出力ファイル: ${outputFileName}`);

    // 統計情報を表示
    const licenseTypes = {};
    Object.values(licensesWithText).forEach(info => {
      const license = info.licenses || 'Unknown';
      licenseTypes[license] = (licenseTypes[license] || 0) + 1;
    });

    console.log('\n=== ライセンス種別統計 ===');
    Object.entries(licenseTypes)
      .sort(([,a], [,b]) => b - a)
      .forEach(([license, count]) => {
        console.log(`${license}: ${count}個`);
      });

  } catch (error) {
    console.error('エラーが発生しました:', error.message);
    console.error(error.stack);
  }
}

// 標準ライセンステンプレートを生成する関数
function generateStandardLicenseText(licenseType, publisher) {
  const getCopyrightHolder = () => {
    if (publisher) {
      return publisher;
    }
    return 'The respective authors and contributors';
  };

  const copyrightHolder = getCopyrightHolder();
  const currentYear = new Date().getFullYear();

  switch (licenseType) {
    case 'MIT':
      return `MIT License

Copyright (c) ${currentYear} ${copyrightHolder}

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.`;

    case 'Apache-2.0':
      return `Apache License
Version 2.0, January 2004
http://www.apache.org/licenses/

TERMS AND CONDITIONS FOR USE, REPRODUCTION, AND DISTRIBUTION

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.`;

    case 'BSD-3-Clause':
      return `BSD 3-Clause License

Copyright (c) ${currentYear}, ${copyrightHolder}
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this
   list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice,
   this list of conditions and the following disclaimer in the documentation
   and/or other materials provided with the distribution.

3. Neither the name of the copyright holder nor the names of its
   contributors may be used to endorse or promote products derived from
   this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.`;

    case 'ISC':
      return `ISC License

Copyright (c) ${currentYear}, ${copyrightHolder}

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted, provided that the above
copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.`;

    case 'BSD-2-Clause':
      return `BSD 2-Clause License

Copyright (c) ${currentYear}, ${copyrightHolder}
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this
   list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice,
   this list of conditions and the following disclaimer in the documentation
   and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.`;

    default:
      return `${licenseType} License

This software is licensed under the ${licenseType} license.
Copyright (c) ${currentYear} ${copyrightHolder}

For the full license text, please refer to the project repository.`;
  }
}

// スクリプトを実行
createLicensesWithText();
