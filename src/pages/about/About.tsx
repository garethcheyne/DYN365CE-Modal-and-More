/**
 * About Page - Single page with tabs for Documentation, Demo, and Tests
 * Uses Fluent UI v9 components throughout
 */
import React, { useState } from 'react';
import {
  makeStyles,
  tokens,
  TabList,
  Tab,
  TabValue,
  SelectTabData,
  SelectTabEvent,
  Button,
  Link,
  Badge,
  Text,
} from '@fluentui/react-components';
import {
  Book24Regular,
  Color24Regular,
  BeakerSettingsRegular,
  BranchFork24Regular,
  Open24Regular,
  Wrench24Regular,
} from '@fluentui/react-icons';
import HowTo from '../howto/HowTo';
import Demo from '../demo/Demo';
import Tests from '../tests/Tests';
import { ModalBuilder } from '../demo/builder';
import '../demo/builder/styles.css';
import logoUrl from '../../../assets/logo.svg';

declare const PACKAGE_VERSION: string;

type TabType = 'documentation' | 'demo' | 'builder' | 'tests';

const useStyles = makeStyles({
  app: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    backgroundColor: tokens.colorNeutralBackground2,
  },
  // Minimal top bar: tabs flush-left, small meta on the right.
  // This surface sits inside a D365 web-resource iframe, so D365 already
  // provides the global header + left nav — we avoid duplicating chrome.
  topBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: `0 ${tokens.spacingHorizontalL}`,
    height: '44px',
    flexShrink: 0,
    backgroundColor: tokens.colorNeutralBackground1,
    borderBottom: `1px solid ${tokens.colorNeutralStroke1}`,
  },
  tabsWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    minWidth: 0,
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXS,
    marginRight: tokens.spacingHorizontalM,
    paddingRight: tokens.spacingHorizontalM,
    borderRight: `1px solid ${tokens.colorNeutralStroke2}`,
    height: '28px',
  },
  brandIcon: {
    width: '18px',
    height: '18px',
    flexShrink: 0,
  },
  brandText: {
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground2,
    whiteSpace: 'nowrap',
  },
  version: {
    marginLeft: tokens.spacingHorizontalXXS,
  },
  tabIcon: {
    marginRight: tokens.spacingHorizontalXS,
  },
  headerActions: {
    display: 'flex',
    gap: tokens.spacingHorizontalXXS,
    alignItems: 'center',
  },
  main: {
    flex: 1,
    minHeight: 0,
    overflow: 'auto',
    backgroundColor: tokens.colorNeutralBackground2,
  },
  tabContent: {
    height: '100%',
  },
  // Thin status strip — left aligned, single line
  statusBar: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
    padding: `0 ${tokens.spacingHorizontalL}`,
    height: '22px',
    flexShrink: 0,
    backgroundColor: tokens.colorNeutralBackground1,
    borderTop: `1px solid ${tokens.colorNeutralStroke1}`,
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase100,
  },
});

export const About: React.FC = () => {
  const styles = useStyles();
  const [activeTab, setActiveTab] = useState<TabType>('documentation');

  const handleTabSelect = (_event: SelectTabEvent, data: SelectTabData) => {
    setActiveTab(data.value as TabType);
  };

  return (
    <div className={styles.app}>
      {/* Minimal top bar — tabs flush-left; D365 provides the outer header + nav */}
      <header className={styles.topBar}>
        <div className={styles.tabsWrap}>
          <div className={styles.brand}>
            <img src={logoUrl} alt="" className={styles.brandIcon} />
            <Text className={styles.brandText}>err403 UI</Text>
            {PACKAGE_VERSION && (
              <Badge appearance="outline" size="small" className={styles.version}>
                v{PACKAGE_VERSION}
              </Badge>
            )}
          </div>

          <TabList selectedValue={activeTab} onTabSelect={handleTabSelect} size="small">
            <Tab value="documentation" icon={<Book24Regular className={styles.tabIcon} />}>
              Documentation
            </Tab>
            <Tab value="demo" icon={<Color24Regular className={styles.tabIcon} />}>
              Demo
            </Tab>
            <Tab value="builder" icon={<Wrench24Regular className={styles.tabIcon} />}>
              Builder
            </Tab>
            <Tab value="tests" icon={<BeakerSettingsRegular className={styles.tabIcon} />}>
              Tests
            </Tab>
          </TabList>
        </div>

        <div className={styles.headerActions}>
          <Button
            as="a"
            href="https://github.com/garethcheyne/DYN365CE-Modal-and-More"
            target="_blank"
            rel="noopener noreferrer"
            appearance="subtle"
            size="small"
            icon={<BranchFork24Regular />}
            title="GitHub"
            aria-label="GitHub"
          />
          <Button
            as="a"
            href="https://err403.com"
            target="_blank"
            rel="noopener noreferrer"
            appearance="subtle"
            size="small"
            icon={<Open24Regular />}
            title="err403.com"
            aria-label="err403.com"
          />
        </div>
      </header>

      {/* Main Content */}
      <main className={styles.main}>
        <div className={styles.tabContent}>
          {activeTab === 'documentation' && <HowTo />}
          {activeTab === 'demo' && <Demo />}
          {activeTab === 'builder' && <ModalBuilder />}
          {activeTab === 'tests' && <Tests />}
        </div>
      </main>

      {/* Thin status strip — left aligned */}
      <footer className={styles.statusBar}>
        <span>© {new Date().getFullYear()} err403.com · Dynamics 365 CE UI Library · Built with TypeScript · React · Fluent UI v9</span>
      </footer>
    </div>
  );
};

export default About;
