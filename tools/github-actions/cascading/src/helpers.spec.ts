import {
  extractBranchesFromGitOutput,
  extractPackageLine,
  extractPackages,
  sortBranches,
} from './helpers';

describe('helpers', () => {
  it('sortBranches should sort release array properly', () => {
    expect(sortBranches([])).toEqual([]);
    expect(sortBranches(['release/1.2', 'release/2.2', 'release/3.2'])).toEqual(['release/1.2', 'release/2.2', 'release/3.2']);
    expect(sortBranches(['release/1.2', 'release/0.1', 'release/3.1', 'release/0.4']))
      .toEqual(['release/0.1', 'release/0.4', 'release/1.2', 'release/3.1']);
    expect(sortBranches(['release/3.0.0-next', 'release/3.0.0-prerelease', 'release/2.5.0-prerelease', 'release/1.2', 'release/2.4', 'release/0.1']))
      .toEqual(['release/0.1', 'release/1.2', 'release/2.4', 'release/2.5.0-prerelease', 'release/3.0.0-next', 'release/3.0.0-prerelease']);
  });

  it('formatGitBranchOutput', () => {
    const fakeOutput = '  remotes/origin/test/3.2 \n remotes/origin/release/0.1.0-test \n remotes/origin/release/0.1-test \n '
      + 'remotes/origin/feature/whatever \n  remotes/origin/release/0.1  \n remotes/origin/release/1.2  \n remotes/origin/bugfix/whatever  '
      + '\r\n remotes/origin/release/2.4 \n remotes/origin/release/2.5.0-prerelease    \r\n remotes/origin/release/3.0.0-rc  \r\n remotes/origin/release/3.0.0-next';
    expect(extractBranchesFromGitOutput(fakeOutput)).toEqual(['release/0.1', 'release/1.2', 'release/2.4', 'release/2.5.0-prerelease', 'release/3.0.0-rc', 'release/3.0.0-next']);
  });

  it('Extract packages name from multiline package json content', () => {
    expect(extractPackageLine('No match to be found here')).toEqual([]);
    const multilineDiffOutput = `"@ngrx/entity": "~14.0.2",
            "@ngrx/router-store": "~14.0.2",
            "@ngrx/store": "~14.0.2",
            "@ngx-translate/core": "^14.0.0",
            "@otter/rules-engine": "~7.5.11",`;
    expect(extractPackageLine(multilineDiffOutput)).toEqual(['@ngrx/entity', '@ngrx/router-store', '@ngrx/store', '@ngx-translate/core', '@otter/rules-engine']);
  });

  it('Extract packages name from the file in conflict', () => {
    expect(extractPackages('No match to be found here')).toEqual({ oldPackages: [], newPackages: [] });
    const conflictPackageJson = `"@ngrx/entity": "~14.0.2",
            ++<<<<<<< HEAD
                "react-dom": "^16.0.3",
                "rimraf": "^3.0.5",
            ++============== RANDOMSTRINGOPTIONAL ==============
                "react-dom": "^16.3.0",
            ++>>>>>>> release/7.1
            "@ngrx/router-store": "~14.0.2",
            "@ngrx/store": "~14.0.2",
            ++<<<<<<< HEAD
                "browserslist": "^4.5.4",
                "concurrently": "^5.3.0",
            ++=======
                "browserslist": "^4.0.4",
                "concurrently": "^5.5.0",
            ++>>>>>>> release/7.1
            "packageManager": "yarn@3.2.2"
        }`;
    expect(extractPackages(conflictPackageJson)).toEqual({
      oldPackages: ['react-dom', 'rimraf', 'browserslist', 'concurrently'],
      newPackages: ['react-dom', 'browserslist', 'concurrently']
    });

    const conflictWithOtherFormat = `"@ngrx/entity": "~14.0.2",
            <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<AUTO GENERATED BY CONFLICT EXTENSION<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< release/7.2
                "react-dom": "^16.0.3",
                "rimraf": "^3.0.5",
            ====================================AUTO GENERATED BY CONFLICT EXTENSION====================================
                "react-dom": "^16.3.0",
            >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>AUTO GENERATED BY CONFLICT EXTENSION>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> release/7.1
            "@ngrx/router-store": "~14.0.2",
            "@ngrx/store": "~14.0.2",
            <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<AUTO GENERATED BY CONFLICT EXTENSION<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< release/7.2
                "browserslist": "^4.5.4",
                "concurrently": "^5.3.0",
            ====================================AUTO GENERATED BY CONFLICT EXTENSION====================================
                "browserslist": "^4.0.4",
                "concurrently": "^5.5.0",
            >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>AUTO GENERATED BY CONFLICT EXTENSION>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> release/7.1
            "packageManager": "yarn@3.2.2"
        }`;
    expect(extractPackages(conflictWithOtherFormat)).toEqual({
      oldPackages: ['react-dom', 'rimraf', 'browserslist', 'concurrently'],
      newPackages: ['react-dom', 'browserslist', 'concurrently']
    });
  });
});
