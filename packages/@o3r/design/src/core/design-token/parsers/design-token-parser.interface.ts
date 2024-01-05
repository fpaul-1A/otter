import type { DesignToken, DesignTokenExtensions, DesignTokenGroup, DesignTokenGroupExtensions } from '../design-token-specification.interface';

export interface ParentReference {
  /** Design Token name */
  name: string;
  /** Design Token Group node */
  tokenNode: DesignTokenGroup;
}

/**
 * Function rendering the Design Token Value
 * @param tokenStructure Parsed Design Token
 * @param variableSet Complete list of the parsed Design Token
 */
// eslint-disable-next-line no-use-before-define
export type TokenValueRenderer = (tokenStructure: DesignTokenVariableStructure, variableSet: Map<string, DesignTokenVariableStructure>) => string;

/**
 * Function rendering the Design Token Key
 * @param tokenStructure Parsed Design Token
 */
// eslint-disable-next-line no-use-before-define
export type TokenKeyRenderer = (tokenStructure: DesignTokenVariableStructure) => string;

/** Complete list of the parsed Design Token */
// eslint-disable-next-line no-use-before-define
export type DesignTokenVariableSet = Map<string, DesignTokenVariableStructure>;

/** Parsed Design Token variable */
export interface DesignTokenVariableStructure {
  /** Design Token Extension */
  extensions: DesignTokenGroupExtensions & DesignTokenExtensions;
  /** Reference to the Design Token node */
  node: DesignToken;
  /** Name of the token in references */
  tokenReferenceName: string;
  /** Description of the Token */
  description?: string;
  /** List of the Ancestors references */
  ancestors: ParentReference[];
  /** Reference to the direct parent node */
  parent?: ParentReference;
  /**
   * Retrieve the list of the references of the Design Token
   * @param variableSet Complete list of the parsed Design Token
   */
  getReferences: (variableSet?: DesignTokenVariableSet) => string[];
  /**
   * Raw CSS value of the Token
   * @param variableSet Complete list of the parsed Design Token
   */
  getCssRawValue: (variableSet?: DesignTokenVariableSet) => string;
  /**
   * Determine if the Token is an alias
   * @param variableSet Complete list of the parsed Design Token
   */
  getIsAlias: (variableSet?: DesignTokenVariableSet) => boolean;
  /**
   * Retrieve the type calculated for the Token
   * @param followReference Determine if the references should be follow to calculate the type
   * @param variableSet Complete list of the parsed Design Token
   */
  getType: (variableSet?: DesignTokenVariableSet, followReference?: boolean) => DesignToken['$type'];
  /**
   * Retrieve the list of the references of the Design Token node
   * @param followReference Determine if the references should be follow to calculate the type
   */
  getReferencesNode: (variableSet?: DesignTokenVariableSet) => DesignTokenVariableStructure[];
  /**
   * Retrieve the Design Token Key as rendered by the provided renderer
   * @param keyRenderer Renderer for the Design Token key
   */
  getKey: (keyRenderer?: TokenKeyRenderer) => string;
}