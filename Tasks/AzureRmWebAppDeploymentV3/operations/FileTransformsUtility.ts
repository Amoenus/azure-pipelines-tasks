import tl = require('vsts-task-lib/task');
import { TaskParameters } from './TaskParameters';
import { parse } from 'webdeployment-common/ParameterParserUtility';
var deployUtility = require('webdeployment-common/utility.js');
var fileTransformationsUtility = require('webdeployment-common/fileTransformationsUtility.js');
var generateWebConfigUtil = require('webdeployment-common/webconfigutil.js');

export class FileTransformsUtility {

    private static rootDirectoryPath: string = "D:\\home\\site\\wwwroot";

    public static async applyTransformations(webPackage: string, taskParams: TaskParameters): Promise<string> {
        var applyFileTransformFlag = taskParams.JSONFiles.length != 0 || taskParams.XmlTransformation || taskParams.XmlVariableSubstitution;
        if (applyFileTransformFlag || taskParams.GenerateWebConfig) {
            var isFolderBasedDeployment: boolean = tl.stats(webPackage).isDirectory();
            var folderPath = await deployUtility.generateTemporaryFolderForDeployment(isFolderBasedDeployment, webPackage);
            if (taskParams.GenerateWebConfig) {
                tl.debug('parsing web.config parameters');
                var webConfigParameters = parse(taskParams.WebConfigParameters);
                generateWebConfigUtil.addWebConfigFile(folderPath, webConfigParameters, this.rootDirectoryPath);
            }

            if (applyFileTransformFlag) {
                var isMSBuildPackage = !isFolderBasedDeployment && (await deployUtility.isMSDeployPackage(webPackage));
                fileTransformationsUtility.fileTransformations(isFolderBasedDeployment, taskParams.JSONFiles, taskParams.XmlTransformation, taskParams.XmlVariableSubstitution, folderPath, isMSBuildPackage);
            }

            var output = await deployUtility.archiveFolderForDeployment(isFolderBasedDeployment, folderPath);
            webPackage = output.webDeployPkg;
        }
        else {
            tl.debug('File Transformation not enabled');
        }

        return webPackage;
    }
}